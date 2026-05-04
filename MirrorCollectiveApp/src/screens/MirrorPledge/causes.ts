import type { CauseIconType } from '@components/CauseIcon';

/**
 * Canonical Mirror Pledge cause list — shared by ViewAllCausesScreen and
 * CausesCarouselScreen. Order here drives the on-screen order in both.
 *
 * Figma reference: Design-Master-File node 2169:3153 (View All Causes) and
 * the seven cause-detail nodes 2169:1120 / 2688 / 2744 / 2800 / 2856 / 2912 /
 * 2968. Labels match Figma exactly (e.g. "WOMEN + CHILDREN" with `+`, not
 * `&`).
 */

export interface Cause {
  id: CauseIconType;
  name: string;
  /** Body copy shown on the cause-detail card. Inter 16px / 24 lh per Figma. */
  description: string;
}

export const CAUSES: Cause[] = [
  {
    id: 'women-cancer',
    name: "WOMEN'S CANCER",
    description:
      'Supporting research, early detection, and compassionate care to help women navigate cancer with strength and dignity. Every woman deserves access to treatment, awareness, and hope for a healthier future.',
  },
  {
    id: 'animal-welfare',
    name: 'ANIMAL WELFARE',
    description:
      'Protecting animals from cruelty and neglect. Supporting shelters, rescue operations, and advocacy for humane treatment of all creatures.',
  },
  {
    id: 'mental-health',
    name: 'MENTAL HEALTH',
    description:
      'Breaking stigma and expanding access to mental health care. Supporting therapy, crisis intervention, and community awareness programs.',
  },
  {
    id: 'environment',
    name: 'ENVIRONMENT',
    description:
      'Combating climate change and protecting natural ecosystems. Supporting reforestation, clean energy, and conservation initiatives worldwide.',
  },
  {
    id: 'women-children',
    name: 'WOMEN + CHILDREN',
    description:
      'Empowering vulnerable women and children through education, shelter, healthcare, and protection from violence and exploitation.',
  },
  {
    id: 'education',
    name: 'EDUCATION',
    description:
      'Expanding access to quality education globally. Supporting schools, scholarships, literacy programs, and learning resources for underserved communities.',
  },
  {
    id: 'human-rights',
    name: 'HUMAN RIGHTS',
    description:
      'Defending fundamental freedoms and dignity for all. Supporting legal aid, advocacy, and protection for marginalized and oppressed communities.',
  },
];
