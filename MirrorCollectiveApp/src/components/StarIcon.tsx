import React from 'react';
import Svg, {
  Path,
  Defs,
  Filter,
  FeFlood,
  FeColorMatrix,
  FeOffset,
  FeGaussianBlur,
  FeComposite,
  FeBlend,
  G,
} from 'react-native-svg';

interface StarIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const StarIcon: React.FC<StarIconProps> = ({
  width = 24,
  height = 24,
  color = '#E5D6B0',
}) => {
  // Scale to desired size while maintaining aspect ratio
  const viewBoxWidth = 33;
  const viewBoxHeight = 32;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      fill="none"
    >
      <Defs>
        <Filter
          id="filter0_d_1223_1685"
          x="0.5"
          y="0"
          width="32"
          height="32"
          filterUnits="userSpaceOnUse"
        >
          <FeFlood floodOpacity="0" result="BackgroundImageFix" />
          <FeColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <FeOffset />
          <FeGaussianBlur stdDeviation="2" />
          <FeComposite in2="hardAlpha" operator="out" />
          <FeColorMatrix
            type="matrix"
            values="0 0 0 0 0.898039 0 0 0 0 0.839216 0 0 0 0 0.690196 0 0 0 1 0"
          />
          <FeBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1223_1685"
          />
          <FeBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1223_1685"
            result="shape"
          />
        </Filter>
      </Defs>
      <G filter="url(#filter0_d_1223_1685)">
        <Path
          d="M20.3987 19.0095C20.828 18.6789 21.3106 18.4129 21.8388 18.2381L28.5 16L21.8388 13.7619C21.3106 13.5833 20.828 13.3211 20.3987 12.9905C20.4405 12.9373 20.4785 12.8841 20.5203 12.8309L24.9851 7.51488L19.6691 11.9797C19.6159 12.0215 19.5627 12.0595 19.5095 12.1013C19.1789 11.6719 18.9129 11.1894 18.7381 10.6612L16.5 4L14.2619 10.6612C14.0833 11.1894 13.8211 11.6719 13.4905 12.1013C13.4373 12.0595 13.3841 12.0215 13.3309 11.9797L8.01488 7.51488L12.4797 12.8309C12.5215 12.8841 12.5595 12.9373 12.6013 12.9905C12.1719 13.3211 11.6894 13.5871 11.1612 13.7619L4.5 16L11.1612 18.2381C11.6894 18.4167 12.1719 18.6789 12.6013 19.0095C12.5595 19.0627 12.5215 19.1159 12.4797 19.1691L8.01488 24.4851L13.3309 20.0203C13.3841 19.9785 13.4373 19.9405 13.4905 19.8987C13.8211 20.3281 14.0871 20.8106 14.2619 21.3388L16.5 28L18.7381 21.3388C18.9167 20.8106 19.1789 20.3281 19.5095 19.8987C19.5627 19.9405 19.6159 19.9785 19.6691 20.0203L24.9851 24.4851L20.5203 19.1691C20.4785 19.1159 20.4405 19.0627 20.3987 19.0095Z"
          fill={color}
        />
      </G>
    </Svg>
  );
};

export default StarIcon;
