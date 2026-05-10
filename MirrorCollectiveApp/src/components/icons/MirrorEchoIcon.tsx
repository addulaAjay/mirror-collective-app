import React from 'react';

import IconMirrorEcho from '@assets/talk-to-mirror/icon-mirror-echo.svg';

interface Props {
  size?: number;
}

const MirrorEchoIcon: React.FC<Props> = ({ size = 100 }) => (
  <IconMirrorEcho width={size} height={size} />
);

export default MirrorEchoIcon;
