import { FC } from 'react';
import { truncateStr } from '../../helpers/strings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCircleXmark,
} from '@fortawesome/free-solid-svg-icons';
import { slate500 } from '../../constants/colors';

interface Props {
  itemToDeleteText: string;
  onClickConfirm: () => void;
  onClickDismiss: () => void;
}

const DeletionAlert: FC<Props> = ({
  itemToDeleteText,
  onClickConfirm: handleClickOnConfirm,
  onClickDismiss: handleClickOnDismiss,
}) => {
  const iconSize = 'lg';
  const enabledIconColor = slate500;

  return (
    <li
      className={'w-100 d-flex flex-row justify-content-start align-items-center bg-light border-top border-start border-end border-secondary p-2'}
    >
      <span>
        Are you sure that you want to delete{' '}
        <em>{truncateStr(itemToDeleteText)}</em>?
      </span>
      <FontAwesomeIcon
        style={{ cursor: 'pointer' }}
        className='ml-auto'
        icon={faCircleCheck}
        size={iconSize}
        color={enabledIconColor}
        onClick={handleClickOnConfirm}
      />
      <FontAwesomeIcon
        style={{ cursor: 'pointer' }}
        className='ml-2'
        icon={faCircleXmark}
        size={iconSize}
        color={enabledIconColor}
        onClick={handleClickOnDismiss}
      />
    </li>
  );
};

export default DeletionAlert;
