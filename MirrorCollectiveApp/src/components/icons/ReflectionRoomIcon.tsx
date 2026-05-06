import React from 'react';

import IconReflectionRoom from '@assets/talk-to-mirror/icon-reflection-room.svg';

interface Props {
  size?: number;
}

const ReflectionRoomIcon: React.FC<Props> = ({ size = 100 }) => (
  <IconReflectionRoom width={size} height={size} />
);

export default ReflectionRoomIcon;
