import { useEffect, useRef, useState } from 'react';

type Conversation = {
  request: {
    prompt: string;
  };
  response: {
    id: string;
    text: string;
  };
};

function App() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [inputText, setInputText] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '1rem';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;

      if (textareaRef.current.scrollHeight > 256) {
        textareaRef.current.style.height = '256px';
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [inputText]);

  const closeInputModal = () => {
    setShowApiKeyModal(false);
    setShowApiKey(false);
  };

  const sendMessage = () => {
    setConversations([
      ...conversations,
      {
        request: {
          prompt: inputText,
        },
        response: {
          id: '1',
          text: '안녕하세요. 저는 챗봇입니다.',
        },
      },
    ]);

    setInputText('');
  };

  return (
    <>
      <div className="h-screen flex">
        <div className="w-64 h-full bg-neutral-800 p-4 flex flex-col justify-end items-center">
          <button
            className="w-full h-12 bg-white rounded"
            onClick={() => {
              setShowApiKey(false);
              setShowApiKeyModal(true);
            }}
          >
            <p className="text-black">OpenAI API Key 입력하기</p>
          </button>
        </div>

        <div className="flex-1 h-full flex flex-col">
          <div className="flex-1 overflow-scroll">
            {conversations.map((conversation, index) => {
              return (
                <div key={index}>
                  <div className="bg-neutral-100 px-6 py-4">
                    <p className="break-word whitespace-pre-wrap">{conversation.request.prompt}</p>
                  </div>
                  <div className="bg-neutral-200 px-6 py-4 flex">
                    <p>{'👉'}</p>
                    <p className="ml-2">{conversation.response.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="w-full bg-neutral-500 p-4 flex items-center relative">
            <textarea
              className="w-full resize-none p-4"
              ref={textareaRef}
              value={inputText}
              placeholder="ChatGPT에게 질문해보세요."
              onChange={(e) => {
                setInputText(e.target.value);
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  sendMessage();
                }
              }}
            />
            <button className="absolute right-8" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      </div>

      {showApiKeyModal && (
        <div
          className="fixed top-0 left-0 w-screen h-screen bg-black/50 flex items-center justify-center"
          onClick={closeInputModal}
        >
          <div
            className="w-4/5 max-w-sm bg-white px-8 pt-6 pb-8 relative rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <button
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center"
              onClick={closeInputModal}
            >
              <img className="w-4 h-4" src="https://www.svgrepo.com/show/507886/x-alt.svg" />
            </button>
            <p>OpenAI API Key를 입력해주세요.</p>
            <div className="w-full h-8 mt-4 flex items-center">
              <input
                className="flex-1 h-full rounded-l pl-2 border-[1px] border-r-0 border-neutral-300 text-xs"
                value={apiKey}
                type={showApiKey ? 'text' : 'password'}
                onChange={(e) => {
                  setApiKey(e.target.value);
                }}
              />
              <button
                className="w-12 h-full bg-white rounded-r border-[1px] border-l-0 border-neutral-300"
                onClick={() => {
                  setShowApiKey((prev) => !prev);
                }}
              >
                <p className="text-xs font-light">{showApiKey ? '가리기' : '보기'}</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
