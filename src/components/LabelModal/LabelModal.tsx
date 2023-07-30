import { FC } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import LabelList from './LabelList/LabelList';

interface Props {
  isShowing: boolean;
  onClose: () => void;
}

const LabelModal: FC<Props> = ({ isShowing, onClose: handleClickOnClose }) => {
  return (
    <Modal
      show={isShowing}
      onHide={handleClickOnClose}
      centered
      size='lg'
    >
      <Modal.Header closeButton>
        <Modal.Title>Label Administration</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <LabelList />
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant='outline-secondary'
          onClick={handleClickOnClose}
        >
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LabelModal;
