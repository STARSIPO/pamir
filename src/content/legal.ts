import type { Localized } from './types';

/**
 * Privacy policy content. This is a reasonable baseline — a lawyer should
 * review it before launch (see PLACEHOLDERS.md). Written in RU & RO.
 */
export interface PolicySection {
  heading: Localized;
  body: Localized[];
}

export const privacyUpdated = '2025-01-01'; // TODO:CONFIRM effective date

export const privacySections: PolicySection[] = [
  {
    heading: { ru: '1. Общие положения', ro: '1. Dispoziții generale' },
    body: [
      {
        ru: 'Настоящая Политика конфиденциальности описывает, как Pamir Construct («Компания») собирает, использует и защищает персональные данные, которые вы предоставляете через сайт.',
        ro: 'Prezenta Politică de confidențialitate descrie modul în care Pamir Construct („Compania”) colectează, utilizează și protejează datele personale pe care le furnizați prin intermediul site-ului.',
      },
    ],
  },
  {
    heading: { ru: '2. Какие данные мы собираем', ro: '2. Ce date colectăm' },
    body: [
      {
        ru: 'Мы обрабатываем данные, которые вы указываете в формах на сайте: имя, номер телефона, при необходимости — адрес электронной почты и текст сообщения.',
        ro: 'Prelucrăm datele pe care le indicați în formularele de pe site: numele, numărul de telefon, iar la necesitate — adresa de e-mail și textul mesajului.',
      },
    ],
  },
  {
    heading: { ru: '3. Цели обработки', ro: '3. Scopurile prelucrării' },
    body: [
      {
        ru: 'Данные используются исключительно для обработки вашей заявки, консультации по проектам и квартирам, а также для связи с вами по вашему запросу.',
        ro: 'Datele sunt utilizate exclusiv pentru prelucrarea cererii dvs., consultanța privind proiectele și apartamentele, precum și pentru a vă contacta la solicitarea dvs.',
      },
    ],
  },
  {
    heading: { ru: '4. Хранение и защита', ro: '4. Stocare și protecție' },
    body: [
      {
        ru: 'Мы принимаем разумные организационные и технические меры для защиты данных и храним их не дольше, чем это необходимо для указанных целей.',
        ro: 'Aplicăm măsuri organizatorice și tehnice rezonabile pentru protejarea datelor și le păstrăm nu mai mult decât este necesar pentru scopurile indicate.',
      },
    ],
  },
  {
    heading: { ru: '5. Передача третьим лицам', ro: '5. Transmiterea către terți' },
    body: [
      {
        ru: 'Мы не продаём и не передаём ваши персональные данные третьим лицам, за исключением случаев, предусмотренных законодательством.',
        ro: 'Nu vindem și nu transmitem datele dvs. personale terților, cu excepția cazurilor prevăzute de legislație.',
      },
    ],
  },
  {
    heading: { ru: '6. Ваши права', ro: '6. Drepturile dvs.' },
    body: [
      {
        ru: 'Вы вправе запросить доступ к своим данным, их исправление или удаление. Для этого свяжитесь с нами по контактам, указанным на сайте.',
        ro: 'Aveți dreptul să solicitați accesul la datele dvs., corectarea sau ștergerea acestora. Pentru aceasta, contactați-ne folosind datele de contact indicate pe site.',
      },
    ],
  },
  {
    heading: { ru: '7. Контакты', ro: '7. Contacte' },
    body: [
      {
        ru: 'По вопросам обработки персональных данных обращайтесь в Pamir Construct: Кишинёв, ул. Дечебал 139/5, офис 1.',
        ro: 'Pentru întrebări privind prelucrarea datelor personale, contactați Pamir Construct: Chișinău, str. Decebal 139/5, oficiul 1.',
      },
    ],
  },
];
