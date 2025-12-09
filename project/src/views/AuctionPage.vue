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
import { io } from 'socket.io-client';
import {
  NCard,
  NInputNumber,
  NButton,
  NTable,
  NSpin,
  useMessage
} from 'naive-ui';
import {
  themeLabel,
  typeLabel,
  statusLabel
} from '@/constants/auction';

const route = useRoute();
const message = useMessage();

const auction = ref(null);
const bids = ref([]);
const bestBid = ref(null);

const bidAmount = ref(null);
const bidLoading = ref(false);
const socket = ref(null);

const currentUserId = ref(null);

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

function setupSocketIO() {
  const id = Number(route.params.id);
  socket.value = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
    withCredentials: true
  });

  socket.value.on('connect', () => {
    socket.value.emit('subscribe', { auctionId: id });
  });

  socket.value.on('auction_state', ({ auction: a, bids: b, bestBid: bb }) => {
    auction.value = a;
    bids.value = b || [];
    bestBid.value = bb || null;
  });

  socket.value.on('bids_update', ({ auction: a, bids: b, bestBid: bb }) => {
    auction.value = a;
    bids.value = b || [];
    bestBid.value = bb || null;
  });

  socket.value.on('bid_error', ({ message: msg }) => {
    bidLoading.value = false;
    message.error(msg || 'Ошибка ставки');
  });

  socket.value.on('bid_success', () => {
    bidLoading.value = false;
    bidAmount.value = null;
    message.success('Ставка принята');
  });

  socket.value.on('disconnect', () => {
  });
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

  if (!socket.value || !socket.value.connected) {
    message.error('Нет соединения с сервером ставок');
    return;
  }

  bidLoading.value = true;

  socket.value.emit('place_bid', {
    auctionId: Number(route.params.id),
    amount: bidAmount.value,
    token
  });
}

onMounted(async () => {
  currentUserId.value = getCurrentUserIdFromToken();
  await loadAuctionHttp();
  setupSocketIO();
});

onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.disconnect();
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