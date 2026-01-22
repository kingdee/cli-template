<template>
  <div class="container">
    <div class="bg-circle"></div>
    <div class="bg-circle-2"></div>
    <div class="bg-circle-3"></div>
    <div class="logos">
      <a href="http://dev.test.kingdee.com/kwc" target="_blank" class="logo-link">
        <img :src="logoUrl" class="logo bounce" alt="KWC logo" />
      </a>
    </div>

    <svg xmlns="http://www.w3.org/2000/svg" width="166" height="49" viewBox="0 0 166 49" fill="none">
      <path
        d="M0 47.6961V0.803865H10.3443V21.3025L29.4209 0.803865H41.9148L22.771 20.6996L42.788 47.6961H30.3613L15.7852 27.7334L10.3443 33.3605V47.6961H0Z"
        fill="url(#paint0_linear_236_1317)" />
      <path
        d="M61.9474 48.0311L45.8935 0.803865H56.9767L66.7165 32.5566L77.2624 0.669889H86.129L96.6748 32.5566L106.415 0.803865H117.229L101.175 48.0311H92.1744L81.5613 17.3501L70.9483 48.0311H61.9474Z"
        fill="url(#paint1_linear_236_1317)" />
      <path
        d="M146.722 48.5C132.885 48.5 122.607 37.8488 122.607 24.384V24.25C122.607 10.9192 132.683 0 147.125 0C155.992 0 161.298 2.94751 165.664 7.23481L159.081 14.8046C155.454 11.5221 151.76 9.51243 147.058 9.51243C139.132 9.51243 133.422 16.0773 133.422 24.116V24.25C133.422 32.2887 138.997 38.9876 147.058 38.9876C152.431 38.9876 155.723 36.8439 159.417 33.4945L166 40.1264C161.164 45.2845 155.79 48.5 146.722 48.5Z"
        fill="url(#paint2_linear_236_1317)"
      />
      <defs>
        <linearGradient id="paint0_linear_236_1317" x1="2.54763e-07" y1="-5.25" x2="185.057" y2="57.8314"
          gradientUnits="userSpaceOnUse">
          <stop stop-color="#915EFF" />
          <stop offset="1" stop-color="#1975FF" />
        </linearGradient>
        <linearGradient id="paint1_linear_236_1317" x1="2.54763e-07" y1="-5.25" x2="185.057" y2="57.8314"
          gradientUnits="userSpaceOnUse">
          <stop stop-color="#915EFF" />
          <stop offset="1" stop-color="#1975FF" />
        </linearGradient>
        <linearGradient id="paint2_linear_236_1317" x1="2.54763e-07" y1="-5.25" x2="185.057" y2="57.8314"
          gradientUnits="userSpaceOnUse">
          <stop stop-color="#915EFF" />
          <stop offset="1" stop-color="#1975FF" />
        </linearGradient>
      </defs>
    </svg>

    <div class="card">
      <sl-button class="custom-button" size="large" pill @click="count++">
        <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
        <sl-icon slot="prefix" name="plus-lg"></sl-icon>
        <span class="count-text">count is {{ count }}</span>
      </sl-button>
      <p>
        Edit <code>app/kwc/ExampleComponent/ExampleComponent.ce.vue</code> to get started
      </p>
      <p style="color: #888;">
        Build stunning web components with KWC
      </p>
    </div>

    <p class="read-the-docs">
      Click on the KWC logo to learn more
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import '@kdcloudjs/shoelace/dist/components/button/button.js';
import '@kdcloudjs/shoelace/dist/components/icon/icon.js';
import '@kdcloudjs/shoelace/dist/themes/light.css';
import logoUrl from './logo.png';

const count = ref(0);
</script>

<style scoped lang="scss">
.container {
  max-width: 100vw;
  margin: 0 auto;
  /* padding: 2rem; */
  text-align: center;
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: #213547;
  background-color: #ffffff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  /* Proportional scaling based on 1920x1000 design draft */
  width: 36.56vw;
  /* (702 / 1920) * 100 */
  height: 67.6vh;
  /* (676 / 1000) * 100 */
  left: 12.86vw;
  /* (247 / 1920) * 100 */
  top: 56.7vh;
  /* (567 / 1000) * 100 */
  border-radius: 50%;
  background: linear-gradient(180deg, rgba(104, 255, 225, 0.22) 0%, rgba(134, 221, 255, 0.44) 100%);
  opacity: 0.61;
  filter: blur(7.8vw);
  /* (150 / 1920) * 100 */
  z-index: 0;
  pointer-events: none;
  transform: translate(-20%, -20%);
}

.bg-circle-2 {
  position: absolute;
  /* Proportional scaling based on 1920x1000 design draft */
  width: 43.33vw;
  /* (832 / 1920) * 100 */
  height: 80.2vh;
  /* (802 / 1000) * 100 */
  left: 48.33vw;
  /* (928 / 1920) * 100 */
  top: 12.6vh;
  /* (126 / 1000) * 100 */
  border-radius: 50%;
  background: linear-gradient(180deg, rgba(195, 104, 255, 0.22) 0%, rgba(134, 181, 255, 0.44) 100%);
  opacity: 0.62;
  filter: blur(6.25vw);
  /* (120 / 1920) * 100 - Scaled blur (400px -> ~120px CSS blur) */
  z-index: 0;
  pointer-events: none;
  transform: translate(-20%, -20%);
}

.bg-circle-3 {
  position: absolute;
  /* Proportional scaling based on 1920x1000 design draft */
  width: 43.33vw;
  /* (832 / 1920) * 100 */
  height: 80.2vh;
  /* (802 / 1000) * 100 */
  left: -19.69vw;
  /* (-378 / 1920) * 100 */
  top: 21.1vh;
  /* (211 / 1000) * 100 */
  border-radius: 50%;
  background: linear-gradient(180deg, rgba(104, 197, 255, 0.34) 0%, rgba(163, 134, 255, 0.44) 100%);
  opacity: 0.19;
  filter: blur(6.25vw);
  /* (120 / 1920) * 100 - Scaled blur (400px -> ~120px CSS blur) */
  z-index: 0;
  pointer-events: none;
  transform: translate(-20%, -20%);
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-20px);
  }
}

.logo {
  height: 12em;
  padding: 1.5em;
  will-change: filter, transform;
  transition: filter 300ms;
  position: relative;
  z-index: 1;
}

.bounce {
  animation: bounce 2s infinite ease-in-out;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
  cursor: pointer;
}

/* Removed .logo.vue selector as it's no longer used */

h1 {
  font-size: 3.2em;
  line-height: 1.1;
  background: -webkit-linear-gradient(315deg, #42d392 25%, #647eff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  z-index: 1;
}

/* button styles removed as sl-button is used */

.custom-button::part(base) {
  background: linear-gradient(95deg, #742FF7 -49.79%, #276FF5 101.75%);
  border: none;
  padding-left: 40px;
  padding-right: 47px;
  color: white;
}

.custom-button::part(label) {
  padding: 0;
  /* Reset internal label padding if needed */
}

/* Ensure text color is white */
.custom-button {
  --sl-color-neutral-0: #ffffff;
  color: white;
}

.custom-button::part(base):hover {
  /* Add a slight brightness or opacity change for hover state if desired */
  opacity: 0.9;
}

.count-text {
  margin-left: 4px;
}

.card {
  padding: 2em;
  position: relative;
  z-index: 1;
}

.read-the-docs {
  color: #888;
  position: relative;
  z-index: 1;
}

@media (prefers-color-scheme: dark) {
  :root {
    color: #f6f6f6;
    background-color: #242424;
  }

  .container {
    color: #f6f6f6;
    background-color: #242424;
  }

  a:hover {
    color: #747bff;
  }

  button {
    background-color: #f9f9f9;
    color: #213547;
  }
}
</style>
