import React, { useState } from 'react';
import SlButton from '@kdcloudjs/shoelace/dist/react/button/index.js';
import SlIcon from '@kdcloudjs/shoelace/dist/react/icon/index.js';
import SlInput from '@kdcloudjs/shoelace/dist/react/input/index.js';
import styles from './ExampleComponent.module.scss';
import logoUrl from './logo.png';

function ExampleComponent() {
    const [count, setCount] = useState(0);
    const [value, setValue] = useState('');

    return (
        <div className={styles.container}>
            <SlInput
                style={{ display: 'none' }}
                value={value}
                onSlInput={event => setValue(event.target.value)}
            />
            <div className={styles['bg-circle']}></div>
            <div className={styles['bg-circle-2']}></div>
            <div className={styles['bg-circle-3']}></div>
            <div className="logos">
                <a href="http://dev.test.kingdee.com/kwc" target="_blank" className="logo-link">
                    <img src={logoUrl} className={`${styles.logo} ${styles.bounce}`} alt="KWC logo" />
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
                        <stop stopColor="#915EFF" />
                        <stop offset="1" stopColor="#1975FF" />
                    </linearGradient>
                    <linearGradient id="paint1_linear_236_1317" x1="2.54763e-07" y1="-5.25" x2="185.057" y2="57.8314"
                        gradientUnits="userSpaceOnUse">
                        <stop stopColor="#915EFF" />
                        <stop offset="1" stopColor="#1975FF" />
                    </linearGradient>
                    <linearGradient id="paint2_linear_236_1317" x1="2.54763e-07" y1="-5.25" x2="185.057" y2="57.8314"
                        gradientUnits="userSpaceOnUse">
                        <stop stopColor="#915EFF" />
                        <stop offset="1" stopColor="#1975FF" />
                    </linearGradient>
                </defs>
            </svg>

            <div className={styles.card}>
                <SlButton className={styles['custom-button']} size="large" pill onClick={() => setCount(count + 1)}>
                    <SlIcon slot="prefix" name="plus-lg"></SlIcon>
                    <span className={styles['count-text']}>count is {count}</span>
                </SlButton>
                <p>
                    Edit <code>app/kwc/ExampleComponent/ExampleComponent.jsx</code> to get started
                </p>
                <p style={{ color: '#888' }}>
                    Build stunning web components with KWC
                </p>
            </div>

            <p className={styles['read-the-docs']}>
                Click on the KWC logo to learn more
            </p>
        </div>
    );
}

export default ExampleComponent;