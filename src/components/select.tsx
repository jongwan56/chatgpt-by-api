import { FC, useState } from 'react';
import ChevronDownIcon from '../assets/icons/chevron-down';

export type Option = {
  value: string;
  label: string;
};

type Props = {
  className?: string;
  options: Option[];
  defaultOption?: Option;
  placeholder: string;
  onChange: (option: Option) => void;
};

const Select: FC<Props> = ({
  className = '',
  options,
  defaultOption = null,
  placeholder,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(defaultOption);

  const handleSelect = (option: Option) => {
    setSelectedOption(option);
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        className="w-full h-full bg-white border border-neutral-300 rounded-md shadow-sm py-2 px-4 flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption ? (
          <span className="block truncate">{selectedOption.label}</span>
        ) : (
          <span className="block truncate text-gray-400">{placeholder}</span>
        )}
        <ChevronDownIcon className="h-5 w-5 ml-2 text-gray-400" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${
                  option === selectedOption && 'bg-gray-100'
                }`}
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Select;
