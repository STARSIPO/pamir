/**
 * Inventory dictionaries, one file pair per feature area so each area can be
 * edited independently. RU files define the shape; RO files are typed against
 * them (`typeof xxxRu`), so a missing RO key fails the type check.
 */
import { commonRu } from './common.ru';
import { commonRo } from './common.ro';
import { selectorRu } from './selector.ru';
import { selectorRo } from './selector.ro';
import { floorsRu } from './floors.ru';
import { floorsRo } from './floors.ro';
import { apartmentRu } from './apartment.ru';
import { apartmentRo } from './apartment.ro';
import { calculatorRu } from './calculator.ru';
import { calculatorRo } from './calculator.ro';
import { recommendRu } from './recommend.ru';
import { recommendRo } from './recommend.ro';

export const inventoryRu = {
  common: commonRu,
  selector: selectorRu,
  floors: floorsRu,
  apartment: apartmentRu,
  calculator: calculatorRu,
  recommend: recommendRu,
};

export const inventoryRo: typeof inventoryRu = {
  common: commonRo,
  selector: selectorRo,
  floors: floorsRo,
  apartment: apartmentRo,
  calculator: calculatorRo,
  recommend: recommendRo,
};
