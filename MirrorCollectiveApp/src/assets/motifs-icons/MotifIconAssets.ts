// To add an icon:
// 1. In Figma, select the icon frame
// 2. Right-click → Copy as SVG  (or Export → SVG)
// 3. Paste the SVG string as the value below

export const MOTIF_SVG: Record<string, string> = {
  compass: `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M120.212 22.2186C174.35 22.2188 218.237 66.107 218.237 120.245C218.237 174.383 174.35 218.27 120.212 218.27C66.074 218.27 22.1857 174.383 22.1855 120.245C22.1855 66.1069 66.0739 22.2186 120.212 22.2186Z" stroke="url(#c_g0)" stroke-width="1.09091"/>
<circle cx="120.211" cy="120.243" r="106.955" stroke="url(#c_g1)" stroke-width="0.545455"/>
<circle cx="120.214" cy="120.242" r="64.7141" stroke="url(#c_g2)" stroke-width="0.545455"/>
<circle cx="120.214" cy="120.243" r="57.3972" stroke="url(#c_g3)" stroke-width="2.18182"/>
<circle cx="120.211" cy="120.243" r="114.272" stroke="url(#c_g4)" stroke-width="1.09091" stroke-dasharray="1.09 17.45"/>
<circle cx="120.212" cy="120.245" r="89.3568" stroke="url(#c_g5)" stroke-width="4.36364" stroke-dasharray="0.55 3.27"/>
<path d="M119.346 100.771L58.174 61.2394L100.782 120.452L61.811 181.25L120.653 139.205L182.252 178.309L139.216 119.513L177.733 58.3194L119.346 100.771Z" fill="url(#c_g6)"/>
<path d="M101.893 102.296L9.13171 119.595L101.888 137.68L119.188 230.495L137.273 137.685L230.056 119.595L137.267 102.291L119.188 9.50873L101.893 102.296Z" fill="url(#c_g7)"/>
<ellipse cx="120.809" cy="119.998" rx="27.6155" ry="27.6232" fill="url(#c_g8)"/>
<defs>
<linearGradient id="c_g0" x1="120.212" y1="22.7645" x2="120.212" y2="217.725" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="c_g1" x1="120.211" y1="13.0146" x2="120.211" y2="227.471" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="c_g2" x1="120.214" y1="55.255" x2="120.214" y2="185.229" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="c_g3" x1="120.214" y1="61.7547" x2="120.214" y2="178.731" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="c_g4" x1="120.211" y1="6.51641" x2="120.211" y2="233.97" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="c_g5" x1="120.212" y1="30.888" x2="120.212" y2="209.602" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="c_g6" x1="57.9609" y1="61.4654" x2="182.072" y2="178.5" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="c_g7" x1="9.13171" y1="120.002" x2="230.056" y2="120.002" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="c_g8" x1="120.809" y1="92.3747" x2="120.809" y2="147.621" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
</defs>
</svg>`,
  mirror: `<svg width="183" height="274" viewBox="0 0 183 274" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M176.012 84.2104C171.512 67.9965 165.054 53.4134 156.818 40.8625C148.485 28.1644 138.738 18.1677 127.847 11.1476C116.37 3.75093 104.141 0 91.5 0C78.8593 0 66.6315 3.75093 55.155 11.1476C44.2636 18.1677 34.5154 28.1644 26.1838 40.8625C17.9478 53.4134 11.4898 67.9965 6.98949 84.2104C2.3515 100.917 0 118.655 0 136.926C0 155.197 2.3515 172.934 6.98949 189.642C11.4898 205.855 17.9478 220.438 26.1838 232.989C34.5173 245.687 44.2636 255.684 55.155 262.704C66.6315 270.101 78.8593 273.852 91.5 273.852C104.141 273.852 116.369 270.101 127.845 262.704C138.736 255.684 148.485 245.687 156.816 232.989C165.052 220.438 171.51 205.855 176.01 189.642C180.648 172.934 183 155.197 183 136.926C183 118.655 180.648 100.917 176.01 84.2104H176.012ZM91.5 269.072C43.6059 269.072 4.77947 209.908 4.77947 136.926C4.77947 63.9435 43.6059 4.77947 91.5 4.77947C139.394 4.77947 178.221 63.9435 178.221 136.926C178.221 209.908 139.394 269.072 91.5 269.072Z" fill="url(#mirrorGradientOuter)"/>
<g transform="translate(4.77947 4.77947)">
<path d="M86.7205 264.293C134.615 264.293 173.441 205.129 173.441 132.146C173.441 59.164 134.615 0 86.7205 0C38.8261 0 0 59.164 0 132.146C0 205.129 38.8261 264.293 86.7205 264.293Z" fill="url(#mirrorGradientMiddle)"/>
<path d="M86.7205 0C38.8265 0 0 59.164 0 132.146C0 205.129 38.8265 264.293 86.7205 264.293C134.615 264.293 173.441 205.129 173.441 132.146C173.441 59.164 134.617 0 86.7205 0ZM144.045 222.966C136.45 234.54 127.648 243.6 117.886 249.891C107.98 256.277 97.4935 259.513 86.7205 259.513C75.9476 259.513 65.4615 256.277 55.5546 249.891C45.793 243.6 36.9912 234.542 29.3956 222.966C21.7026 211.245 15.6556 197.564 11.4191 182.306C7.01243 166.431 4.77755 149.555 4.77755 132.146C4.77755 114.738 7.01243 97.8624 11.4191 81.987C15.6537 66.729 21.7026 53.0482 29.3956 41.3271C36.9912 29.7531 45.793 20.6932 55.5546 14.4015C65.4615 8.01612 75.9476 4.77947 86.7205 4.77947C97.4935 4.77947 107.98 8.01612 117.886 14.4015C127.648 20.6932 136.45 29.7512 144.045 41.3271C151.738 53.0482 157.785 66.729 162.022 81.987C166.429 97.8624 168.664 114.738 168.664 132.146C168.664 149.555 166.429 166.431 162.022 182.306C157.787 197.564 151.738 211.245 144.045 222.966Z" fill="url(#mirrorGradientInner)"/>
</g>
<defs>
<linearGradient id="mirrorGradientOuter" x1="91.5" y1="0" x2="91.5" y2="273.852" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="mirrorGradientMiddle" x1="86.7206" y1="0" x2="86.7206" y2="264.293" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="mirrorGradientInner" x1="173.441" y1="132.146" x2="0" y2="132.146" gradientUnits="userSpaceOnUse">
<stop stop-color="#2F333B"/>
<stop offset="1" stop-color="#C59D5F"/>
</linearGradient>
</defs>
</svg>`,
  blocks: `<svg width="299" height="258" viewBox="0 0 299 258" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#blocks_clip)">
<path d="M202.936 0L299 196.389L226.292 222.745L119.707 0H202.936Z" fill="url(#blocks_g0)"/>
<path d="M115.078 3.14634L220.857 225.331L180.583 257.46L79.8645 51.9409L115.078 3.14634Z" fill="url(#blocks_g1)"/>
<path d="M0 151.549L90.186 178.796C90.8745 205.147 89.1482 231.602 89.3897 258L0 224.439V151.549Z" fill="url(#blocks_g2)"/>
<path d="M159.765 229.138L95.0513 257.476L96.31 178.796L129.982 167.511L159.765 229.138Z" fill="url(#blocks_g3)"/>
<path d="M108.866 123.793L127.413 162.031L94.0443 173.342C65.4379 165.713 37.2888 156.279 8.73901 148.397L108.871 123.793H108.866Z" fill="url(#blocks_g4)"/>
<path d="M287.707 207.139L260.838 229.788L196.258 252.751L226.451 228.776C246.889 221.639 267.111 213.762 287.707 207.139Z" fill="url(#blocks_g5)"/>
</g>
<defs>
<linearGradient id="blocks_g0" x1="209.353" y1="0" x2="209.353" y2="222.745" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="blocks_g1" x1="150.361" y1="3.14634" x2="150.361" y2="257.46" gradientUnits="userSpaceOnUse">
<stop stop-color="#2F333B"/>
<stop offset="1" stop-color="#C59D5F"/>
</linearGradient>
<linearGradient id="blocks_g2" x1="45.1747" y1="151.549" x2="45.1747" y2="258" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="blocks_g3" x1="159.765" y1="212.493" x2="95.0513" y2="212.493" gradientUnits="userSpaceOnUse">
<stop stop-color="#2F333B"/>
<stop offset="1" stop-color="#C59D5F"/>
</linearGradient>
<linearGradient id="blocks_g4" x1="68.0761" y1="123.793" x2="68.0761" y2="173.342" gradientUnits="userSpaceOnUse">
<stop stop-color="#2F333B"/>
<stop offset="1" stop-color="#C59D5F"/>
</linearGradient>
<linearGradient id="blocks_g5" x1="241.983" y1="207.139" x2="241.983" y2="252.751" gradientUnits="userSpaceOnUse">
<stop stop-color="#2F333B"/>
<stop offset="1" stop-color="#C59D5F"/>
</linearGradient>
<clipPath id="blocks_clip">
<rect width="299" height="258" fill="white"/>
</clipPath>
</defs>
</svg>`,
spiral: `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M34.5329 203.986C-39.3065 128.73 13.0306 1.77061 118.123 0.0175387C202.459 -1.39163 261.826 82.3614 232.339 162.138C201.965 244.315 96.0016 266.626 34.5413 203.986H34.5329ZM188.28 179.032C242.735 124.192 200.4 31.1869 125.932 27.1272C39.1364 22.388 -3.49159 124.921 53.3318 188.233C120.45 263.02 242.718 207.332 231.46 106.703C220.621 9.91524 97.617 -27.3353 34.466 47.2749C-31.037 124.661 31.3775 241.521 132.059 231.791C135.005 231.506 139.132 230.919 141.986 230.231C142.622 230.08 143.317 230.173 143.752 229.535C100.814 234.928 58.1361 214.345 35.7382 177.522C-8.58887 104.623 44.2421 11.4502 130.427 19.7458C212.151 27.6137 253.214 132.093 189.686 188.443C138.73 233.637 56.5961 207.106 41.4381 140.976C24.2045 65.7869 105.635 9.31131 168.075 54.3374C211.774 85.8507 213.624 155.235 164.535 182.546C111.252 212.189 45.7905 164.202 60.237 104.732C74.4324 46.2683 157.797 41.8647 178.102 98.5416C198.625 155.831 130.494 197.451 91.4735 155.361C61.9026 123.462 83.6393 70.2157 128.268 78.2177C157.839 83.5273 175.733 123.638 151.151 144.876C126.97 165.77 88.837 141.689 98.0606 112.625C106.765 85.1881 150.004 96.2433 142.329 126.163C139.893 135.641 130.603 143.073 120.802 143.023C122.425 144.541 126.15 144.994 128.368 145.094C152.775 146.185 161.613 118.547 148.615 100.144C126.167 68.3536 76.4997 90.7744 86.9705 131.514C98.3536 175.811 163.413 174.72 173.097 129.468C183.526 80.7677 123.254 45.8657 85.1207 78.6958C44.309 113.841 73.8548 180.214 125.112 183.687C184.974 187.747 213.599 118.429 176.972 73.3695C133.75 20.1988 47.0041 51.1333 46.7363 119.721C46.4517 193.19 136.386 231.28 188.297 179.015L188.28 179.032ZM119.496 104.497C99.0148 105.243 100.187 137.486 122.225 135.213C140.546 133.326 139.207 103.784 119.496 104.497Z" fill="url(#spiral_g0)"/>
<defs>
<linearGradient id="spiral_g0" x1="226.603" y1="21.203" x2="-1.48977" y2="236.463" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="0.5" stop-color="#7A684D"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
</defs>
</svg>`,
  'radiant-burst': `<svg width="349" height="280" viewBox="0 0 349 280" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M276.036 240.33L192.412 168.405L218.319 275.581L177.716 173.06L150.821 280L162.541 170.357L88.9975 252.557L150.356 160.918L47.0208 199.544L143.96 146.904L34.5 133.111L144.819 131.516L54.3043 68.4645L152.732 118.295L101.905 20.4285L165.882 110.258L166.39 0L181.265 109.257L232.986 11.8624L195.352 115.507L286.439 53.2915L204.918 127.591L314.5 114.799L207.773 142.728L310.751 182.305L203.258 157.458L276.036 240.33Z" fill="url(#rb_g0)"/>
<path d="M219.93 217.579L180.808 160.232L179.1 229.607L171.116 160.668L137.346 221.299L162.331 156.553L104.232 194.545L156.461 148.83L87.3487 155.479L154.855 139.268L90.5586 113.053L157.884 130.053L113.129 76.9785L164.848 123.305L149.891 55.5299L174.152 120.561L192.421 53.6152L183.666 122.458L230.974 71.6747L191.213 128.552L256.721 105.568L195.06 137.457L263.761 147.53L194.329 147.124L250.485 187.959L189.185 155.343L219.93 217.579Z" fill="url(#rb_g1)"/>
<defs>
<linearGradient id="rb_g0" x1="174.5" y1="0" x2="174.5" y2="280" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<radialGradient id="rb_g1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(174.546 140.046) rotate(105) scale(88.1121)">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</radialGradient>
</defs>
</svg>`,
  feather: `<svg width="260" height="250" viewBox="48 159 260 250" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M222.269 163.16L209.308 188.762C220.188 178.014 225.265 167.406 242.388 165.415C272 161.962 302.257 180.394 289.502 212.964C272.93 255.271 222.537 261.633 182.251 259.191C182.724 260.995 186.902 261.695 188.511 262.069C201.818 265.179 217.854 264.728 231.43 263.437C238.446 262.769 245.416 260.358 252.527 260.778C228.481 279.831 204.657 299.818 175.203 310.38C173.8 311.717 175.912 311.624 176.874 311.935C182.219 313.662 188.479 314.486 194.14 314.673C170.567 333.104 137.944 337.211 108.711 339.201C110.477 344.365 136.919 344.568 136.84 347.196L103.303 352.003L108.711 356.249L89.2698 352.531C129.887 276.596 193.856 211.487 281.744 193.008C281.744 191.142 277.014 191.826 275.752 191.904C227.646 194.984 170.11 235.596 138.449 269.799C107.812 302.914 86.684 338.922 70.065 380.482C68.7405 383.78 63.7422 399.971 62.7962 401.045C61.2194 402.818 58.1448 401.294 56.8203 403.16H52.5C55.0543 385.024 65.1771 369.205 71.8783 352.485L60.0684 328.5L69.797 331.689L66.5646 318.903L73.0451 321.034V301.296C73.0451 299.476 75.9463 291.373 76.845 289.055C80.5977 279.458 88.0084 269.146 95.7345 262.364C91.9976 278.12 88.5918 293.535 89.2541 309.851C89.3014 311.142 88.4342 313.817 90.3263 313.568C92.1553 266.424 117.557 218.813 163.866 201.563C160.744 212.202 155.099 224.085 154.153 235.191C154.059 236.358 153.349 239.173 155.21 238.893C165.458 215.329 174.84 188.015 198.145 174.032C205.429 169.662 213.723 167.157 221.181 163.16H222.269Z" fill="url(#feather_g0)"/>
<defs>
<linearGradient id="feather_g0" x1="172.5" y1="163.16" x2="172.5" y2="403.16" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
</defs>
</svg>`,
  waves: `<svg width="252" height="252" viewBox="0 0 252 252" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#waves_clip)">
<path d="M245.822 127.517L241.64 107.745C218.829 21.7245 109.56 -8.38275 49.4147 59.7593C-7.92023 124.724 31.0583 226.234 113.429 243.065L127.514 245.828C72.4209 248.833 22.9006 210.449 9.71448 157.464C-12.1854 69.4559 66.1148 -10.6841 154.62 9.00478C208.914 21.0855 248.969 71.3786 245.822 127.511V127.517Z" fill="url(#waves_g0)"/>
<path d="M128.106 50.022L114.967 53.1398C61.6253 67.2084 37.7495 133.392 74.5629 176.627C119.209 229.056 202.999 197.73 209.157 131.659C210.192 131.523 209.713 133.002 209.743 133.718C211.074 166.357 190.747 196.648 161.039 209.255C125.432 224.365 83.1939 212.929 60.4185 181.887C19.5291 126.163 58.5669 47.1112 128.1 50.0161L128.106 50.022Z" fill="url(#waves_g1)"/>
<path d="M132.247 181.354L145.664 177.319C227.401 131.144 128.709 32.2854 82.4486 114.1L78.4141 127.517V117.756C78.4141 104.504 93.3157 86.6843 104.431 80.4723C152.686 53.5184 206.406 107.663 179.082 155.72C173.065 166.304 155.259 181.354 142.599 181.354H132.247Z" fill="url(#waves_g2)"/>
<path d="M100.899 131.665L104.934 141.521C132.14 179.834 179.844 131.215 141.132 104.728L131.661 100.901C157.968 99.8477 171.101 131.061 154.715 150.868C136.784 172.539 99.6749 160.441 100.905 131.659L100.899 131.665Z" fill="url(#waves_g3)"/>
<path d="M144.664 128.109L141.139 121.885C127.118 106.965 106.833 127.636 122.179 141.438L128.106 144.674C114.476 144.26 108.655 127.429 118.322 118.034C127.923 108.704 144.185 114.656 144.664 128.115V128.109Z" fill="url(#waves_g4)"/>
<path d="M127.934 125.275C136.914 122.601 136.914 137.167 127.934 134.493C124.125 133.357 124.125 126.411 127.934 125.275Z" fill="url(#waves_g5)"/>
</g>
<defs>
<linearGradient id="waves_g0" x1="125.996" y1="5.99759" x2="125.996" y2="245.993" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="waves_g1" x1="126.807" y1="49.9382" x2="126.807" y2="215.875" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="waves_g2" x1="132.444" y1="73.2876" x2="132.444" y2="181.354" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="waves_g3" x1="131.405" y1="100.875" x2="131.405" y2="161.946" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="waves_g4" x1="129.098" y1="113.51" x2="129.098" y2="144.674" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="waves_g5" x1="129.873" y1="124.946" x2="129.873" y2="134.822" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<clipPath id="waves_clip">
<rect width="240" height="240" fill="white" transform="translate(6 6)"/>
</clipPath>
</defs>
</svg>`,
  pyramid: `<svg width="280" height="243" viewBox="0 0 280 243" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M140 158.314L0 243H280L140 158.314Z" fill="url(#pyramid_g0)"/>
<path d="M0 243L140 158.314V0L0 243Z" fill="url(#pyramid_g1)"/>
<path d="M140 0V158.314L280 243L140 0Z" fill="url(#pyramid_g2)"/>
<defs>
<linearGradient id="pyramid_g0" x1="140" y1="158.314" x2="140" y2="243" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="pyramid_g1" x1="70" y1="0" x2="70" y2="243" gradientUnits="userSpaceOnUse">
<stop stop-color="#2F333B"/>
<stop offset="1" stop-color="#C59D5F"/>
</linearGradient>
<linearGradient id="pyramid_g2" x1="210" y1="0" x2="210" y2="243" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
</defs>
</svg>`,
  'water-drop': `<svg width="157" height="240" viewBox="0 0 157 240" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M81.7551 7.97867C123.911 102.63 152.797 121.661 156.214 148.818C167.794 240.804 48.1429 273.422 9.13173 198.634C-19.445 143.857 25.8742 97.2065 51.5605 52.3889C53.4692 49.0568 64.3036 30.3226 76.5378 3.79496C77.2831 2.18441 77.883 0.870064 78.283 0C79.0646 1.81418 80.2644 4.60949 81.7732 7.97867H81.7551ZM21.275 186.268C31.0369 208.297 55.7961 223.088 75.7925 223.458C90.1354 223.717 99.4246 210.518 91.2988 198.245C82.7185 185.286 44.6344 189.618 35.2907 160.869C34 156.926 33.1638 153.557 32.4912 146.393C30.7097 127.344 36.1814 111.942 40.0716 103.352C17.6393 128.288 10.0043 160.906 21.2568 186.286L21.275 186.268Z" fill="url(#wd_g0)"/>
<defs>
<linearGradient id="wd_g0" x1="78.5" y1="0" x2="78.5" y2="240" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
</defs>
</svg>`,
 'brick-stack': `<svg width="278" height="206" viewBox="34 0 278 206" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M225.4 0L188.37 55.1748H115.754C115.917 52.7313 117.956 50.5131 119.216 48.5313C129.71 32.0577 141.386 16.5412 151.822 0H225.4Z" fill="url(#bs_g0)"/>
<path d="M115.273 161.02H188.37C191.611 161.02 188.803 187.054 188.803 190.916C188.803 193.337 191.294 204.935 188.37 204.935H115.273C115.167 204.935 113.83 203.37 113.83 203.246V162.709C113.83 162.405 114.955 161.595 115.273 161.02Z" fill="url(#bs_g1)"/>
<path d="M186.927 61.9309H111.906V105.846H186.927V61.9309Z" fill="url(#bs_g2)"/>
<path d="M145.57 111.476H70.5488V155.39H145.57V111.476Z" fill="url(#bs_g3)"/>
<path d="M109.021 161.02H34V204.935H109.021V161.02Z" fill="url(#bs_g4)"/>
<path d="M269.642 161.02H194.621V204.935H269.642V161.02Z" fill="url(#bs_g5)"/>
<path d="M226.361 111.476V153.701C226.361 153.825 225.024 155.39 224.918 155.39H151.34V111.476H226.361Z" fill="url(#bs_g6)"/>
<path d="M308.114 99.0894L274.422 150.289L270.123 155.39H234.055L272.046 99.0894H308.114Z" fill="url(#bs_g7)"/>
<path d="M263.871 49.5447C264.631 50.3104 261.082 55.1297 260.408 56.1882C250.165 72.2452 238.816 87.3676 228.813 103.65C227.572 105.834 225.014 105.857 223.004 105.857H197.997C197.333 105.857 194.804 106.026 195.602 104.179L232.622 49.5559H263.88L263.871 49.5447Z" fill="url(#bs_g8)"/>
<path d="M231.17 148.634V109.787C243.327 91.9955 254.571 72.9659 267.719 56.3008V95.1484L231.17 148.634Z" fill="url(#bs_g9)"/>
<path d="M311 144.693C300.786 160.458 290.369 176.053 279.847 191.536C278.847 193.011 276.615 197.92 276.356 198.168C276.163 198.348 274.384 198.562 274.442 197.594C275.23 184.948 275.307 171.774 275.182 159.095L311 105.835V144.682V144.693Z" fill="url(#bs_g10)"/>
<path d="M192.698 97.9634V59.1159L228.285 6.7561V45.6037L192.698 97.9634Z" fill="url(#bs_g11)"/>
<path d="M73.4331 105.846L107.096 56.8638V104.156C107.096 104.28 105.759 105.846 105.654 105.846H73.4331Z" fill="url(#bs_g12)"/>
<path d="M36.8857 155.39L65.7399 112.602V153.701C65.7399 153.825 64.403 155.39 64.2972 155.39H36.8857Z" fill="url(#bs_g13)"/>
<defs>
<linearGradient id="bs_g0" x1="211.137" y1="1.90025e-06" x2="159.821" y2="75.4465" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="bs_g1" x1="180.033" y1="161.02" x2="137.44" y2="215.629" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="bs_g2" x1="177.168" y1="61.9309" x2="134.43" y2="115.946" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="bs_g3" x1="135.811" y1="111.476" x2="93.0736" y2="165.491" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="bs_g4" x1="99.262" y1="161.02" x2="56.5247" y2="215.035" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="bs_g5" x1="259.883" y1="161.02" x2="217.146" y2="215.035" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="bs_g6" x1="216.602" y1="111.476" x2="173.865" y2="165.491" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="bs_g7" x1="298.48" y1="99.0894" x2="242.2" y2="153.861" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="bs_g8" x1="255.063" y1="49.5447" x2="199.056" y2="99.9666" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="bs_g9" x1="262.964" y1="56.3008" x2="213.156" y2="70.8873" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="bs_g10" x1="306.244" y1="105.835" x2="256.41" y2="120.409" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="bs_g11" x1="223.656" y1="6.7561" x2="175.049" y2="20.7872" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="bs_g12" x1="102.717" y1="56.8638" x2="63.139" y2="76.9878" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
<linearGradient id="bs_g13" x1="61.9865" y1="112.602" x2="27.8007" y2="129.657" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/><stop offset="1" stop-color="#2F333B"/>
</linearGradient>
</defs>
</svg>`,
  sprout: `<svg width="254" height="240" viewBox="0 0 254 240" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M254 0C250.483 45.5671 234.233 82.8493 191.605 102.616C172.091 111.666 140.217 116.951 123.992 128.055C118.92 131.523 118.065 138.674 116.673 144.501C109.142 175.882 110.795 207.953 110.722 240H100.944C99.8366 209.729 103.769 177.666 97.2884 147.937C96.3277 143.548 92.4443 130.332 89.3181 127.636C85.9801 124.759 64.365 121.825 58.5847 120.436C23.2271 111.962 7.16433 93.5507 0 57.5342C4.56726 56.8521 9.02869 58.4055 13.4331 58.4055C31.7347 58.4055 48.6035 55.8164 66.498 63.1397C92.4118 73.7425 100.537 102.37 102.572 128.219L92.3303 111.041C84.2216 99.2712 71.2933 86.3425 58.0718 80.6959C57.3228 80.3753 55.9958 78.9123 55.3608 80.1452C77.8877 91.4301 92.0373 112.94 100.96 136.027L106.635 161.104C114.255 112.636 137.767 59.8438 184.791 39.4521C184.88 37.7342 182.511 38.9753 181.771 39.2795C144.068 54.6986 119.221 94.274 106.236 131.523C104.388 92.3671 111.471 45.5589 147.422 23.5069C179.442 3.84658 218.569 7.73425 254 0Z" fill="url(#sprout_g0)"/>
<defs>
<linearGradient id="sprout_g0" x1="127" y1="0" x2="127" y2="240" gradientUnits="userSpaceOnUse">
<stop stop-color="#C59D5F"/>
<stop offset="1" stop-color="#2F333B"/>
</linearGradient>
</defs>
</svg>`,
};
