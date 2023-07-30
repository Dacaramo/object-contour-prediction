import { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { red500 } from '../../../constants/colors';
import { truncateStr } from '../../../helpers/strings';

interface Props {
  name: string;
  isFirstIndex: boolean;
  isLastIndex: boolean;
  isSelected?: boolean;
  hasError?: boolean;
  onClick: () => void;
}

const ImageListItem: FC<Props> = ({
  name,
  isFirstIndex,
  isLastIndex,
  isSelected = false,
  hasError = false,
  onClick: handleClick,
}) => {
  return (
    <li
      style={{ cursor: 'pointer' }}
      className={`w-100 d-flex flex-row justify-content-between align-items-center p-2 border-secondary ${
        (isFirstIndex && !isLastIndex) && 'border-top border-bottom'
      } ${
        (!isFirstIndex && !isLastIndex) && 'border-bottom'
      } ${isSelected ? 'bg-secondary' : 'bg-light'}`}
      onClick={handleClick}
    >
      <span className={`${isSelected ? 'text-light' : ''}`}>
        {truncateStr(name)}
      </span>
      {hasError && (
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          size='lg'
          color={red500}
        />
      )}
    </li>
  );
};

export default ImageListItem;
