import localforage from 'localforage';
import { useCallback, useEffect, useRef, useState } from 'react';
import ChatBubbleLeftRightIcon from './assets/icons/chat-bubble-left-right';
import EllipsisHorizontalIcon from './assets/icons/ellipsis-horizontal';
import EyeIcon from './assets/icons/eye';
import EyeSlashIcon from './assets/icons/eye-slash';
import PaperAirplaneIcon from './assets/icons/paper-airplane';
import PlusIcon from './assets/icons/plus';
import { getSystemMessage, parseJson } from './common/utils';
import Select, { Option } from './components/select';

export type Message = {
  role: 'system' | 'assistant' | 'user';
  content: string;
};

export type ChatRoom = {
  id: number;
  name: string;
};

function App() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const [apiKey, setApiKey] = useState('');
  const [apiKeyTemp, setApiKeyTemp] = useState('');
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  const [model, setModel] = useState('');
  const [modelTemp, setModelTemp] = useState('');
  const [possibleModels, setPossibleModels] = useState<string[]>([]);
  const [showModelModal, setShowModelModal] = useState(false);

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([getSystemMessage()]);
  const [isLoading, setIsLoading] = useState(false);

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentChatRoomId, setCurrentChatRoomId] = useState(0);

  const getApiKeyOrShowModal = useCallback(async () => {
    const savedApiKey = await localforage.getItem<string>('api-key');
    if (savedApiKey) {
      try {
        await verifyAndSaveApiKey(savedApiKey);
      } catch {
        await localforage.removeItem('api-key');
        setShowApiKeyModal(true);
      }
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

  const verifyAndSaveApiKey = useCallback(async (apiKey: string) => {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const data = (await response.json()).data as { id: string }[];

    const models = data.filter((model) => model.id.includes('gpt-')).map((model) => model.id);
    const defaultModel = models.at(-1) ?? '';

    setPossibleModels(models);
    setModel(defaultModel);
    setModelTemp(defaultModel);
    setApiKey(apiKey);
    setApiKeyTemp('');

    await localforage.setItem('api-key', apiKey);
  }, []);

  const createChatRoom = useCallback(async () => {
    const id = chatRooms.length + 1;
    await saveChatRooms([...chatRooms, { id, name: `Chat ${id}` }]);
    await changeCurrentChatRoom(id);
  }, [chatRooms]);

  const loadChatRooms = useCallback(async () => {
    const rawChatRooms = await localforage.getItem<string>('chat-rooms');
    const chatRooms: ChatRoom[] = rawChatRooms ? JSON.parse(rawChatRooms) : [];

    if (chatRooms.length === 0) {
      await createChatRoom();
    } else {
      setChatRooms(chatRooms);
      await changeCurrentChatRoom(chatRooms[chatRooms.length - 1].id);
    }
  }, []);

  const loadMessages = useCallback(async (chatRoomId: number) => {
    const rawMessages = await localforage.getItem<string>(`messages-${chatRoomId}`);
    const messages: Message[] = rawMessages ? JSON.parse(rawMessages) : [];

    if (messages.length === 0) {
      await saveMessages([getSystemMessage()]);
    } else {
      setMessages(messages);
    }
  }, []);

  const saveMessages = useCallback(
    async (messages: Message[]) => {
      await localforage.setItem(`messages-${currentChatRoomId}`, JSON.stringify(messages));
      setMessages(messages);
    },
    [currentChatRoomId],
  );

  const saveChatRooms = useCallback(async (chatRooms: ChatRoom[]) => {
    await localforage.setItem('chat-rooms', JSON.stringify(chatRooms));
    setChatRooms(chatRooms);
  }, []);

  const changeCurrentChatRoom = useCallback(async (id: number) => {
    await loadMessages(id);
    setCurrentChatRoomId(id);
  }, []);

  // API Key 불러오기
  useEffect(() => {
    if (!apiKey) {
      getApiKeyOrShowModal();
    }
  }, [apiKey]);

  // Chat Room 불러오기
  useEffect(() => {
    loadChatRooms();
  }, []);

  // 입력창 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '1rem';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;

      if (textareaRef.current.scrollHeight > 256) {
        textareaRef.current.style.height = '256px';
        textareaRef.current.style.overflowY = 'auto';
        textareaRef.current.scrollTop = 256;
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [inputText]);

  // 새 메시지 추가 시 채팅창 아래로 스크롤
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (isLoading) {
      return;
    }

    const originalMessages = [getSystemMessage(), ...messages.slice(1)];
    const inputMessages = [...originalMessages, { role: 'user' as const, content: inputText }];

    await saveMessages(inputMessages);
    setInputText('');
    setIsLoading(true);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: inputMessages,
        stream: true,
      }),
    });

    if (response.status !== 200) {
      const { error } = await response.json();

      if (error.code === 'context_length_exceeded') {
        alert('대화가 너무 길어져서 ChatGPT가 고장났어요.');
      } else if (response.status === 429) {
        alert('API 요청 제한을 초과했어요.\nOpenAI 계정에 결제 정보가 등록되었는지 확인해주세요.');
      } else {
        alert(error.message);
      }

      await saveMessages(originalMessages);

      setIsLoading(false);

      return;
    }

    if (!response.body) {
      throw new Error();
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

    const responseMessage = {
      role: 'assistant' as const,
      content: '',
    };

    await saveMessages([...inputMessages, responseMessage]);

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      for (const data of value.split('data: ')) {
        const delta = parseJson(data)?.choices?.[0]?.delta?.content;
        if (delta) {
          responseMessage.content += delta;
          await saveMessages([...inputMessages, responseMessage]);
        }
      }
    }

    setIsLoading(false);
  }, [isLoading, messages, inputText, apiKey, model]);

  return (
    <>
      <div className="h-screen flex">
        {/* 사이드바 */}
        <div className="w-64 h-full bg-neutral-800 p-3 flex flex-col items-center">
          <button
            className="w-full flex justify-center items-center p-3 rounded border-[1px] border-neutral-600 hover:bg-neutral-600 mb-3"
            onClick={createChatRoom}
          >
            <PlusIcon className="w-5 h-5 text-white" />
            <p className="ml-2 text-white">New Chat</p>
          </button>

          <div className="flex-1 w-full overflow-scroll flex flex-col space-y-2">
            {chatRooms
              .slice()
              .reverse()
              .map((chatRoom) => {
                const isCurrent = currentChatRoomId === chatRoom.id;

                return (
                  <button
                    key={chatRoom.id}
                    className={`w-full flex p-3 rounded ${
                      isCurrent ? 'bg-neutral-600' : 'hover:bg-neutral-700'
                    }`}
                    disabled={isCurrent}
                    onClick={() => {
                      changeCurrentChatRoom(chatRoom.id);
                    }}
                  >
                    <div className="flex-1 flex items-center space-x-3">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 text-neutral-300" />
                      <span className="text-white">{chatRoom.name}</span>
                    </div>
                  </button>
                );
              })}
          </div>

          <div className="w-full h-0 border-b-[1px] border-neutral-600 mb-3" />

          <div className="w-full flex flex-col space-y-2">
            {model && (
              <button
                className="w-full flex flex-col items-center font-mono hover:bg-neutral-700 rounded p-2"
                onClick={() => {
                  setShowModelModal(true);
                }}
              >
                <p className="text-white">Model</p>
                <p className="text-neutral-400">{model}</p>
              </button>
            )}

            {apiKey && (
              <button
                className="w-full flex flex-col items-center font-mono hover:bg-neutral-700 rounded p-2"
                onClick={() => {
                  setShowApiKey(false);
                  setShowApiKeyModal(true);
                }}
              >
                <p className="text-white">API Key</p>
                <p className="text-neutral-400">
                  {apiKey.substring(0, 3) + '...' + apiKey.substring(apiKey.length - 4)}
                </p>
              </button>
            )}
          </div>
        </div>

        {/* 채팅창 + 입력창 */}
        <div className="flex-1 h-full flex flex-col">
          {/* 채팅창 */}
          <div className="flex-1 overflow-scroll" ref={chatWindowRef}>
            {messages.map((message, index) =>
              message.role === 'user' ? (
                <div key={index} className="bg-neutral-100 px-6 py-4">
                  <p className="break-word whitespace-pre-wrap">{message.content.trim()}</p>
                </div>
              ) : message.role === 'assistant' ? (
                <div key={index} className="bg-neutral-200 px-6 py-4 flex">
                  <p className="ml-2 break-word whitespace-pre-wrap">
                    {'👉 ' + message.content.trim()}
                  </p>
                </div>
              ) : null,
            )}
          </div>

          {/* 입력창 */}
          <div className="w-full bg-neutral-500 p-4 flex items-center">
            <textarea
              className="flex-1 resize-none p-4 rounded-l disabled:bg-white"
              ref={textareaRef}
              value={inputText}
              placeholder="ChatGPT에게 질문해보세요."
              disabled={!model}
              onChange={(e) => {
                setInputText(e.target.value);
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  sendMessage();
                }
              }}
            />
            <button
              className="w-16 h-full rounded-r bg-white flex items-center justify-center"
              onClick={sendMessage}
            >
              {isLoading ? (
                <EllipsisHorizontalIcon className="w-6 h-6 text-neutral-800" />
              ) : (
                <PaperAirplaneIcon className="w-6 h-6 text-neutral-800" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 모델 선택 모달 */}
      {showModelModal && (
        <div className="fixed top-0 left-0 w-screen h-screen bg-black/50 flex items-center justify-center">
          <div className="w-4/5 max-w-sm bg-white px-8 py-6 rounded-lg flex flex-col items-center relative">
            <p>사용할 모델을 선택해주세요.</p>
            <Select
              className="w-full h-12 mt-6"
              options={possibleModels.map((model) => ({ label: model, value: model }))}
              defaultOption={{ label: model, value: model }}
              placeholder="Select model"
              onChange={(option: Option) => {
                setModelTemp(option.value);
              }}
            />
            <button
              className="w-16 h-8 rounded bg-green-600 disabled:opacity-70 mt-6"
              disabled={!modelTemp}
              onClick={async () => {
                setModel(modelTemp);
                setShowModelModal(false);
              }}
            >
              <p className="text-xs text-white">확인</p>
            </button>
            <button
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center"
              onClick={() => {
                setShowModelModal(false);
              }}
            >
              <img className="w-4 h-4" src="https://www.svgrepo.com/show/507886/x-alt.svg" />
            </button>
          </div>
        </div>
      )}

      {/* API Key 입력 모달 */}
      {showApiKeyModal && (
        <div className="fixed top-0 left-0 w-screen h-screen bg-black/50 flex items-center justify-center">
          <div className="w-4/5 max-w-sm bg-white px-8 py-6 rounded-lg flex flex-col items-center relative">
            <p>OpenAI API Key를 입력해주세요.</p>
            <a
              className="text-neutral-500 text-xs underline mt-2"
              href="https://jongwan56.notion.site/OpenAI-API-Key-d671160525e94ed68f2f8b812b98ce9a"
              target="_blank"
            >
              API Key가 뭔가요...?
            </a>
            <div className="w-full h-8 mt-6 flex items-center">
              <input
                className="flex-1 h-full rounded-l pl-2 border-[1px] border-r-0 border-neutral-300 text-xs"
                value={apiKeyTemp}
                type={showApiKey ? 'text' : 'password'}
                onChange={(e) => {
                  setApiKeyTemp(e.target.value);
                }}
              />
              <button
                className="w-10 h-full bg-white rounded-r border-[1px] border-l-0 border-neutral-300 flex justify-center items-center"
                onClick={() => {
                  setShowApiKey((prev) => !prev);
                }}
              >
                {showApiKey ? (
                  <EyeIcon className="w-4 h-4 text-neutral-400" />
                ) : (
                  <EyeSlashIcon className="w-4 h-4 text-neutral-400" />
                )}
              </button>
            </div>
            <button
              className="w-16 h-8 rounded bg-green-600 disabled:opacity-70 mt-6"
              disabled={apiKeyLoading || !apiKeyTemp}
              onClick={async () => {
                setApiKeyLoading(true);

                try {
                  await verifyAndSaveApiKey(apiKeyTemp);
                  setShowApiKey(false);
                  setShowApiKeyModal(false);
                } catch {
                  alert('API Key를 다시 확인해주세요!');
                } finally {
                  setApiKeyLoading(false);
                }
              }}
            >
              <p className="text-xs text-white">{apiKeyLoading ? '확인 중' : '확인'}</p>
            </button>
            {apiKey && (
              <button
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center"
                onClick={() => {
                  setApiKeyTemp('');
                  setShowApiKeyModal(false);
                  setShowApiKey(false);
                }}
              >
                <img className="w-4 h-4" src="https://www.svgrepo.com/show/507886/x-alt.svg" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
