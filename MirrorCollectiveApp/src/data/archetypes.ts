export interface Archetype {
  id: string;
  name: string;
  title: string;
  description: string;
  image: any;
}

export const archetypes: Record<string, Archetype> = {
  seeker: {
    id: 'seeker',
    name: 'Seeker',
    title: 'THE SEEKER',
    description:
      'Seekers have a profound desire to find meaning, truth, and purpose in life, coupled with the joy of discovering deeper truths.\n\nAre you ready to discover yourself?',
    image: require('../assets/seeker-archetype.png'),
  },
  guardian: {
    id: 'guardian',
    name: 'Guardian',
    title: 'THE GUARDIAN',
    description:
      'Guardians are loyal, dependable, and organized, with a strong desire to help and support others.\n\nAre you ready to find your truth?',
    image: require('../assets/guardian-archetype.png'),
  },
  flamebearer: {
    id: 'flamebearer',
    name: 'Flamebearer',
    title: 'THE FLAMEBEARER',
    description:
      'Flamebearers embody light, sparking transformation wherever you go — by being passionate, purposeful and courageous.\n\nWhich path will you take?',
    image: require('../assets/flamebearer-archetype.png'),
  },
  weaver: {
    id: 'weaver',
    name: 'Weaver',
    title: 'THE WEAVER',
    description:
      'Weavers embody the ability to connect, create, and shape reality through patterns, weaving invisible threads into meaning.\n\nWhat story is woven into your destiny?',
    image: require('../assets/weaver-archetype.png'),
  },
};

export const getArchetypeByAnswers = (_answers: any[]): Archetype => {
  // Simple logic to determine archetype based on answers
  // This can be expanded with more sophisticated scoring
  const archetypeIds = Object.keys(archetypes);
  const randomIndex = Math.floor(Math.random() * archetypeIds.length);
  return archetypes[archetypeIds[randomIndex]];
};
