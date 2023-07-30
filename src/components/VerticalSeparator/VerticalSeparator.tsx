import { FC } from 'react';

interface Props {}

const VerticalSeparator: FC<Props> = () => {
  return (
    <div
      style={{ width: '1px' }}
      className='h-100 bg-secondary'
    />
  );
};

export default VerticalSeparator;
