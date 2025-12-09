export const THEME_LABELS = {
  cars: 'Автомобили',
  real_estate_residential: 'Жилая недвижимость',
  electronics: 'Электроника',
  furniture: 'Мебель',
  clothes: 'Одежда',
  sports: 'Спорт',
  kids_toys: 'Детские игрушки',
  books: 'Книги',
  services_it: 'IT-услуги',
  services_repair: 'Ремонт и строительство',
  game_items: 'Игровые предметы',
  business_equipment: 'Оборудование для бизнеса',
  charity: 'Благотворительность'
};

export const TYPE_LABELS = {
  classic: 'Классический',
  dutch: 'Голландский'
};

export const STATUS_LABELS = {
  appointed: 'Назначен',
  active: 'Активен',
  finished: 'Завершён'
};

export const themeOptions = Object.entries(THEME_LABELS).map(([value, label]) => ({
  label,
  value
}));

export const typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({
  label,
  value
}));

export const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  label,
  value
}));

export function themeLabel(value) {
  return THEME_LABELS[value] || value || '—';
}

export function typeLabel(value) {
  return TYPE_LABELS[value] || value || '—';
}

export function statusLabel(value) {
  return STATUS_LABELS[value] || value || '—';
}

export const sortOptions = [
  { label: 'Новые сначала', value: 'created_desc' },
  { label: 'Скоро заканчиваются', value: 'end_asc' },
  { label: 'Позже заканчиваются', value: 'end_desc' }
];

export const DEFAULT_SORT = 'created_desc';