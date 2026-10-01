/**
 * News dictionaries, one file pair per area (common, list, article, home).
 * RU files define the shape; RO files are typed against them.
 */
import { commonRu } from './common.ru';
import { commonRo } from './common.ro';
import { listRu } from './list.ru';
import { listRo } from './list.ro';
import { articleRu } from './article.ru';
import { articleRo } from './article.ro';
import { homeRu } from './home.ru';
import { homeRo } from './home.ro';

export const newsRu = { common: commonRu, list: listRu, article: articleRu, home: homeRu };
export const newsRo: typeof newsRu = { common: commonRo, list: listRo, article: articleRo, home: homeRo };
