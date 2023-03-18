import { useState } from 'react';

function App() {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const closeInputModal = () => {
    setShowApiKeyModal(false);
    setShowApiKey(false);
  };

  return (
    <>
      <div>
        <div className="fixed w-full h-14 bg-green-800 px-4 flex items-center">
          <button
            className="w-52 h-8 bg-white rounded"
            onClick={() => {
              setShowApiKey(false);
              setOpenApiKeyInput(true);
            }}
          >
            <p className="text-black">OpenAI API Key 입력하기</p>
          </button>
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
