import { palette } from '@theme';
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
  testID?: string;
}

const StarIcon: React.FC<StarIconProps> = ({
  width = 28,
  height = 28,
  color = palette.gold.warm,
  testID,
}) => {
  // Scale to desired size while maintaining aspect ratio
  const viewBoxWidth = 28;
  const viewBoxHeight = 28;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      fill="none"
      testID={testID}
    >
      <Defs>
        <Filter
          id="filter0_d_347_1243"
          x="0"
          y="0"
          width="28"
          height="28"
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
            values="0 0 0 0 0.898039 0 0 0 0 0.839216 0 0 0 0 0.690196 0 0 0 0.5 0"
          />
          <FeBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_347_1243"
          />
          <FeBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_347_1243"
            result="shape"
          />
        </Filter>
      </Defs>
      <G filter="url(#filter0_d_347_1243)">
        <Path
          d="M17.2489 16.5079C17.6067 16.2324 18.0089 16.0108 18.449 15.8651L24 14L18.449 12.1349C18.0089 11.9861 17.6067 11.7676 17.2489 11.4921C17.2837 11.4478 17.3154 11.4034 17.3502 11.3591L21.0709 6.92907L16.6409 10.6498C16.5966 10.6846 16.5522 10.7163 16.5079 10.7511C16.2324 10.3933 16.0108 9.99113 15.8651 9.55098L14 4L12.1349 9.55098C11.9861 9.99113 11.7676 10.3933 11.4921 10.7511C11.4477 10.7163 11.4034 10.6846 11.3591 10.6498L6.92906 6.92907L10.6498 11.3591C10.6846 11.4034 10.7163 11.4478 10.7511 11.4921C10.3933 11.7676 9.99114 11.9892 9.55098 12.1349L4 14L9.55098 15.8651C9.99114 16.0139 10.3933 16.2324 10.7511 16.5079C10.7163 16.5522 10.6846 16.5966 10.6498 16.6409L6.92906 21.0709L11.3591 17.3502C11.4034 17.3154 11.4477 17.2837 11.4921 17.2489C11.7676 17.6067 11.9892 18.0089 12.1349 18.449L14 24L15.8651 18.449C16.0139 18.0089 16.2324 17.6067 16.5079 17.2489C16.5522 17.2837 16.5966 17.3154 16.6409 17.3502L21.0709 21.0709L17.3502 16.6409C17.3154 16.5966 17.2837 16.5522 17.2489 16.5079Z"
          fill={color}
        />
      </G>
    </Svg>
  );
};

export default StarIcon;
