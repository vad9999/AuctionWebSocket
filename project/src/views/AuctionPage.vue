<template>
  <div class="auction-page" v-if="auction">
    <n-card class="auction-card" :title="auction.title">
      <div class="auction-main">
        <div class="left">
          <p><b>Описание:</b> {{ auction.description }}</p>
          <p><b>Тема:</b> {{ themeLabel(auction.theme) }}</p>
          <p><b>Тип:</b> {{ typeLabel(auction.type) }}</p>
          <p><b>Статус:</b> {{ statusLabel(auction.status) }}</p>
          <p><b>Стартовая цена:</b> {{ auction.startingPrice }}</p>
          <p><b>Текущая цена:</b> {{ auction.currentPrice }}</p>
          <p><b>Начинается:</b> {{ formatDateTime(auction.startsAt) }}</p>
          <p><b>Завершается:</b> {{ formatDateTime(auction.endsAt) }}</p>
          <p><b>Организатор:</b>
            {{ auction.creator?.lastName }} {{ auction.creator?.firstName }}
            ({{ auction.creator?.email }})
          </p>
        </div>

        <div class="right">
          <n-card size="small" title="Сделать ставку">
            <div v-if="auction.status === 'appointed'">
              Аукцион ещё не начался. Вы можете только просматривать детали.
            </div>

            <div v-else-if="auction.status === 'finished'">
              Аукцион завершён.
            </div>

            <div v-else-if="isOwner()">
              Вы являетесь организатором этого аукциона и не можете делать по нему ставки.
            </div>

            <div v-else>
              <n-input-number
                v-model:value="bidAmount"
                :min="0"
                placeholder="Сумма ставки"
                style="width: 100%; margin-bottom: 8px"
              />
              <n-button
                type="primary"
                :loading="bidLoading"
                @click="sendBid"
              >
                Сделать ставку
              </n-button>
            </div>
          </n-card>

          <n-card size="small" title="Текущая лучшая ставка">
            <div v-if="bestBid">
              <p>
                <b>
                  {{ bestBid.User?.lastName }} {{ bestBid.User?.firstName }}
                </b><br />
                Сумма: {{ bestBid.amount }}<br />
                Время: {{ formatDateTime(bestBid.createdAt) }}
              </p>
            </div>
            <div v-else>
              Пока нет ставок
            </div>
          </n-card>
        </div>
      </div>
    </n-card>

    <div class="bottom">
      <n-card class="bids-card" title="История ставок">
        <n-table v-if="bids.length">
          <thead>
            <tr>
              <th>Время</th>
              <th>Участник</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bid in bids" :key="bid.id">
              <td>{{ formatDateTime(bid.createdAt) }}</td>
              <td>
                {{ bid.User?.lastName }} {{ bid.User?.firstName }}
                ({{ bid.User?.email }})
              </td>
              <td>{{ bid.amount }}</td>
            </tr>
          </tbody>
        </n-table>
        <div v-else>Ставок пока нет</div>
      </n-card>
    </div>
  </div>

  <div v-else class="auction-page">
    <n-spin>Загрузка аукциона...</n-spin>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api/client';
import {
  NCard,
  NInputNumber,
  NButton,
  NTable,
  NSpin,
  useMessage
} from 'naive-ui';

const route = useRoute();
const message = useMessage();

const auction = ref(null);
const bids = ref([]);
const bestBid = ref(null);

const bidAmount = ref(null);
const bidLoading = ref(false);
const ws = ref(null);

const currentUserId = ref(null);

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

function getToken() {
  return localStorage.getItem('accessToken');
}

function getCurrentUserIdFromToken() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || null;
  } catch {
    return null;
  }
}

function isOwner() {
  if (!auction.value || !currentUserId.value) return false;
  const creatorId = auction.value.creator?.id ?? auction.value.createdBy;
  return creatorId === currentUserId.value;
}

async function loadAuctionHttp() {
  try {
    const id = route.params.id;
    const res = await api.get(`/api/auctions/${id}`);
    auction.value = res.data.auction;
    bids.value = res.data.bids || [];
    bestBid.value = res.data.bestBid || null;
  } catch (e) {
    message.error(e.response?.data?.error || 'Ошибка загрузки аукциона');
  }
}

function setupWebSocket() {
  const id = Number(route.params.id);
  ws.value = new WebSocket('ws://localhost:3000');

  ws.value.onopen = () => {
    ws.value.send(JSON.stringify({
      type: 'subscribe',
      auctionId: id
    }));
  };

  ws.value.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.type === 'auction_state') {
        auction.value = msg.auction;
        bids.value = msg.bids || [];
        bestBid.value = msg.bestBid || null;
      }

      if (msg.type === 'bids_update') {
        auction.value = msg.auction;
        bids.value = msg.bids || [];
        bestBid.value = msg.bestBid || null;
      }

      if (msg.type === 'bid_error') {
        bidLoading.value = false;
        message.error(msg.message || 'Ошибка ставки');
      }

      if (msg.type === 'bid_success') {
        bidLoading.value = false;
        bidAmount.value = null;
        message.success('Ставка принята');
      }
    } catch (e) {
      console.error('WS parse error:', e);
    }
  };

  ws.value.onerror = (e) => {
    console.error('WS error:', e);
  };

  ws.value.onclose = () => {
    ws.value = null;
  };
}

function sendBid() {
  if (!auction.value) return;
  if (auction.value.status !== 'active') {
    message.error('Сейчас по этому аукциону нельзя делать ставки');
    return;
  }
  if (isOwner()) {
    message.error('Организатор не может делать ставки в своём аукционе');
    return;
  }
  if (!bidAmount.value) {
    message.error('Введите сумму ставки');
    return;
  }

  const token = getToken();
  if (!token) {
    message.error('Необходимо авторизоваться');
    return;
  }

  if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
    message.error('Нет соединения с сервером ставок');
    return;
  }

  bidLoading.value = true;

  ws.value.send(JSON.stringify({
    type: 'place_bid',
    auctionId: Number(route.params.id),
    amount: bidAmount.value,
    token
  }));
}

onMounted(async () => {
  currentUserId.value = getCurrentUserIdFromToken();
  await loadAuctionHttp();
  setupWebSocket();
});

onBeforeUnmount(() => {
  if (ws.value) {
    ws.value.close();
  }
});
</script>

<style scoped>
.auction-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auction-card {
  width: 100%;
}

.auction-main {
  display: flex;
  gap: 16px;
}

.left {
  flex: 2;
}

.right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bottom {
  display: flex;
}

.bids-card {
  flex: 1;
}
</style>