import React from 'react';

import PledgeSvg from '@assets/talk-to-mirror/pledge-icon.svg';

interface Props {
  size?: number;
}

const MirrorPledgeIcon: React.FC<Props> = ({ size = 100 }) => (
  <PledgeSvg width={size} height={size} />
);

export default MirrorPledgeIcon;
