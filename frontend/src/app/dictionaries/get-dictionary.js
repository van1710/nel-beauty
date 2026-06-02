const dictionaries = {
  fr: () => import('./fr.json').then((module) => module.default),
  en: () => import('./en.json').then((module) => module.default),
};

export const getDictionary = async (locale) => {
  // Par défaut, si la langue demandée n'existe pas, on renvoie le français
  return dictionaries[locale] ? dictionaries[locale]() : dictionaries['fr']();
};