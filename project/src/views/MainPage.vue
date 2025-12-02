<template>
  <div class="home-page">
    <!-- Верхняя панель -->
    <div class="top-bar">
      <div class="filters-left">
        <n-input
          v-model:value="search"
          placeholder="Поиск по названию аукциона..."
          clearable
          class="filter-item wide"
          @update:value="handleFiltersChange"
        />

        <n-select
          v-model:value="selectedTheme"
          :options="themeOptions"
          placeholder="Тема"
          clearable
          class="filter-item"
          @update:value="handleFiltersChange"
        />

        <n-select
          v-model:value="selectedType"
          :options="typeOptions"
          placeholder="Тип аукциона"
          clearable
          class="filter-item"
          @update:value="handleFiltersChange"
        />

        <n-select
          v-model:value="selectedStatus"
          :options="statusOptions"
          placeholder="Статус"
          clearable
          class="filter-item"
          @update:value="handleFiltersChange"
        />

        <n-select
          v-model:value="sort"
          :options="sortOptions"
          placeholder="Сортировка"
          class="filter-item"
          @update:value="handleFiltersChange"
        />
      </div>

      <div class="actions-right">
        <n-button type="success" @click="openCreateModal">
          Создать аукцион
        </n-button>
        <n-button @click="goToProfile">
          Настройки профиля
        </n-button>
      </div>
    </div>

    <!-- Список аукционов -->
    <div class="auctions-list">
      <n-spin :show="loading && !appendLoading">
        <n-alert v-if="error" type="error" class="mb-12">
          {{ error }}
        </n-alert>

        <n-empty v-else-if="!auctions.length && !loading">
          Нет аукционов по текущему фильтру
        </n-empty>

        <n-grid
          v-else
          :cols="3"
          :x-gap="24"
          :y-gap="24"
          responsive="screen"
        >
          <n-gi
            v-for="auction in auctions"
            :key="auction.id"
          >
            <div class="card-wrapper">
              <n-card
                class="auction-card"
                :title="auction.title"
                :bordered="true"
              >
                <div class="auction-card-body">
                  <div class="line">
                    <span class="label">Тема:</span>
                    <span class="value">{{ themeLabel(auction.theme) }}</span>
                  </div>
                  <div class="line">
                    <span class="label">Тип:</span>
                    <span class="value">{{ typeLabel(auction.type) }}</span>
                  </div>
                  <div class="line">
                    <span class="label">Статус:</span>
                    <span class="value">{{ statusLabel(auction.status) }}</span>
                  </div>
                  <div class="line">
                    <span class="label">Текущая цена:</span>
                    <span class="value">{{ auction.currentPrice }}</span>
                  </div>
                  <div class="line">
                    <span class="label">Стартовая цена:</span>
                    <span class="value">{{ auction.startingPrice }}</span>
                  </div>
                  <div class="line">
                    <span class="label">Начинается:</span>
                    <span class="value">{{ formatDateTime(auction.startsAt) }}</span>
                  </div>
                  <div class="line">
                    <span class="label">Завершается:</span>
                    <span class="value">{{ formatDateTime(auction.endsAt) }}</span>
                  </div>
                  <div class="line">
                    <span class="label">Организатор:</span>
                    <span class="value">
                      {{ auction.creator?.lastName }} {{ auction.creator?.firstName }}
                      ({{ auction.creator?.email }})
                    </span>
                  </div>
                </div>
              </n-card>
            </div>
          </n-gi>
        </n-grid>
      </n-spin>

      <div
        ref="loadMoreTrigger"
        class="load-more-trigger"
      ></div>

      <div v-if="appendLoading" class="append-loading">
        <n-spin size="small" />
      </div>
    </div>

    <!-- Модальное окно создания аукциона -->
    <n-modal
      v-model:show="showCreateModal"
      preset="card"
      title="Создание аукциона"
      style="width: 600px; max-width: 95vw"
    >
      <n-form label-placement="top">
        <n-form-item label="Название">
          <n-input v-model:value="createTitle" placeholder="Введите название" />
        </n-form-item>

        <n-form-item label="Описание">
          <n-input
            v-model:value="createDescription"
            type="textarea"
            placeholder="Краткое описание лота"
          />
        </n-form-item>

        <n-form-item label="Тема">
          <n-select
            v-model:value="createTheme"
            :options="themeOptions"
            placeholder="Выберите тему"
          />
        </n-form-item>

        <n-form-item label="Тип аукциона">
          <n-select
            v-model:value="createType"
            :options="typeOptions"
            placeholder="Выберите тип"
          />
        </n-form-item>

        <n-form-item label="Стартовая цена">
          <n-input-number
            v-model:value="createStartingPrice"
            :min="0"
            placeholder="0.00"
          />
        </n-form-item>

        <n-form-item label="Время начала">
          <n-date-picker
            v-model:value="createStartsAt"
            type="datetime"
            format="dd.MM.yyyy HH:mm"
            value-format="timestamp"
          placeholder="Выберите дату и время начала"
          :is-date-disabled="disablePastDates"
          />
        </n-form-item>

        <n-form-item label="Время окончания">
          <n-date-picker
            v-model:value="createEndsAt"
            type="datetime"
            format="dd.MM.yyyy HH:mm"
            value-format="timestamp"
            placeholder="Выберите дату и время окончания"
            :is-date-disabled="disablePastDates"
          />
        </n-form-item>

        <n-space justify="end">
          <n-button @click="closeCreateModal">
            Отмена
          </n-button>
          <n-button
            type="primary"
            :loading="createLoading"
            @click="handleCreateAuction"
          >
            Создать
          </n-button>
        </n-space>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api/client';
import {
  NInput,
  NSelect,
  NButton,
  NCard,
  NGrid,
  NGi,
  NSpin,
  NEmpty,
  NAlert,
  NModal,
  NForm,
  NFormItem,
  NInputNumber,
  NSpace,
  NDatePicker,      // <-- добавить
  useMessage
} from 'naive-ui';

const router = useRouter();
const message = useMessage();

// фильтры
const search = ref('');
const selectedTheme = ref(null);   
const selectedType = ref(null);    
const selectedStatus = ref(null);  
const sort = ref('created_desc');

// данные
const auctions = ref([]);
const loading = ref(false);
const appendLoading = ref(false);
const error = ref('');

// ENUM мапы (должны совпадать с model Auction)
const THEME_LABELS = {
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

const TYPE_LABELS = {
  classic: 'Классический',
  dutch: 'Голландский'
};

const STATUS_LABELS = {
  appointed: 'Назначен',
  active: 'Активен',
  finished: 'Завершён'
};

const themeOptions = Object.entries(THEME_LABELS).map(([value, label]) => ({
  label,
  value
}));

const typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({
  label,
  value
}));

const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  label,
  value
}));

const sortOptions = [
  { label: 'Новые сначала', value: 'created_desc' },
  { label: 'Скоро заканчиваются', value: 'end_asc' },
  { label: 'Позже заканчиваются', value: 'end_desc' }
];

// пагинация
const page = ref(1);
const pageSize = 12;
const hasMore = ref(false);

// infinite scroll
const loadMoreTrigger = ref(null);
let observer = null;

// состояниe модалки создания
const showCreateModal = ref(false);
const createTitle = ref('');
const createDescription = ref('');
const createTheme = ref(null);
const createType = ref('classic');
const createStartingPrice = ref(null);
const createStartsAt = ref(null); // number | null
const createEndsAt = ref(null);   // number | null
const createLoading = ref(false);

function goToProfile() {
  router.push('/profile');
}

function themeLabel(value) {
  return THEME_LABELS[value] || value || '—';
}
function typeLabel(value) {
  return TYPE_LABELS[value] || value || '—';
}
function statusLabel(value) {
  return STATUS_LABELS[value] || value || '—';
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

async function loadAuctions({ reset = false } = {}) {
  if (reset) {
    loading.value = true;
    appendLoading.value = false;
    page.value = 1;
    auctions.value = [];
  } else {
    appendLoading.value = true;
  }

  error.value = '';

  try {
    const res = await api.get('/api/auctions', {
      params: {
        search: search.value || undefined,
        theme: selectedTheme.value || undefined,
        type: selectedType.value || undefined,
        status: selectedStatus.value || undefined,
        sort: sort.value || undefined,
        page: page.value,
        limit: pageSize
      }
    });

    const { items, hasMore: hm } = res.data;

    if (reset) {
      auctions.value = items;
    } else {
      auctions.value = auctions.value.concat(items);
    }

    hasMore.value = hm;
    if (hm) page.value += 1;
  } catch (e) {
    console.error(e);
    error.value =
      e.response?.data?.error || e.message || 'Ошибка загрузки аукционов';
  } finally {
    loading.value = false;
    appendLoading.value = false;
  }
}

function handleFiltersChange() {
  loadAuctions({ reset: true });
}

function setupObserver() {
  if (!loadMoreTrigger.value) return;

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (
        entry.isIntersecting &&
        hasMore.value &&
        !appendLoading.value &&
        !loading.value
      ) {
        loadAuctions({ reset: false });
      }
    },
    {
      root: null,
      rootMargin: '0px 0px 200px 0px',
      threshold: 0.1
    }
  );

  observer.observe(loadMoreTrigger.value);
}

// модалка создания
function openCreateModal() {
  showCreateModal.value = true;
}

function disablePastDates(ts) {
  const now = Date.now();
  // запрещаем выбирать дату/время в прошлом (с небольшим запасом)
  return ts < now - 60 * 1000;
}

function closeCreateModal() {
  showCreateModal.value = false;
}

async function handleCreateAuction() {
  if (
    !createTitle.value ||
    !createDescription.value ||
    !createTheme.value ||
    !createStartingPrice.value ||
    !createStartsAt.value ||
    !createEndsAt.value
  ) {
    message.error('Заполните все обязательные поля');
    return;
  }

  createLoading.value = true;

  try {
    if (
      !createTitle.value ||
      !createDescription.value ||
      !createTheme.value ||
      !createStartingPrice.value ||
      !createStartsAt.value ||
      !createEndsAt.value
    ) {
      message.error('Заполните все обязательные поля');
      return;
    }

    const payload = {
      title: createTitle.value,
      description: createDescription.value,
      theme: createTheme.value,     // ENUM theme
      type: createType.value,       // ENUM type
      startingPrice: createStartingPrice.value,
      startsAt: new Date(createStartsAt.value).toISOString(),
      endsAt: new Date(createEndsAt.value).toISOString()
    };

    const res = await api.post('/api/auctions', payload);

    message.success('Аукцион создан');
    showCreateModal.value = false;

    // очистим форму
    createTitle.value = '';
    createDescription.value = '';
    createTheme.value = null;
    createType.value = 'classic';
    createStartingPrice.value = null;
    createStartsAt.value = null;
    createEndsAt.value = null;

    // перезагрузим список
    await loadAuctions({ reset: true });
  } catch (e) {
    const msg = e.response?.data?.error || e.message || 'Ошибка создания аукциона';
    message.error(msg);

    if (e.response?.status === 401) {
      router.push('/auth');
    }
  } finally {
    createLoading.value = false;
  }
}

onMounted(async () => {
  await loadAuctions({ reset: true });
  setupObserver();
});

onBeforeUnmount(() => {
  if (observer && loadMoreTrigger.value) {
    observer.unobserve(loadMoreTrigger.value);
  }
  if (observer) observer.disconnect();
});
</script>

<style scoped>
.home-page {
  padding: 16px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
}

.filters-left {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-item {
  min-width: 180px;
  max-width: 220px;
}

.filter-item.wide {
  min-width: 260px;
  max-width: 320px;
}

.actions-right {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.auctions-list {
  margin-top: 8px;
}

.card-wrapper {
  height: 100%; /* ячейка грида по высоте */
}

.auction-card {
  height: 100%;              /* карта занимает всю высоту ячейки */
  display: flex;
  flex-direction: column;
}

.auction-card-body {
  flex: 1;                   /* тело растягивается до низа карточки */
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Строка: лейбл слева, значение справа с переносом */
.line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
}

.label {
  font-weight: 600;
  min-width: 110px;       /* фиксированная ширина под "Организатор:" и т.п. */
  white-space: nowrap;    /* не переносить текст метки */
  flex-shrink: 0;
}

.value {
  flex: 1;
  word-break: break-word; /* переносить длинные значения (email и т.п.) */
}

.mb-12 {
  margin-bottom: 12px;
}

.load-more-trigger {
  height: 1px;
  margin-top: 16px;
}

.append-loading {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}
</style>