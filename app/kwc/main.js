import '@kdcloudjs/kwc-synthetic-shadow';
import { createElement } from '@kdcloudjs/kwc';
import exampleComponent from './exampleComponent/exampleComponent.js';
import { setBasePath } from '@kdcloudjs/shoelace/dist/utilities/base-path.js';

setBasePath('/');

// 动态添加 viewport meta，确保移动端显示比例正常
// eslint-disable-next-line
if (!document.querySelector('meta[name="viewport"]')) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    document.head.appendChild(meta);
}

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && !/Win32|MacIntel/i.test(navigator.platform);

const style = document.createElement('style');

if (!isMobile) {
    style.textContent = `
html,body { 
    height: 100%; 
    padding: 0; 
    margin: 0; 
    font-size:12px; 
    --kdds-base-font-size: 12; 
} 
html,body,input, textarea, select, button{ 
    font-family:'Roboto', 'San Francisco', 'Helvetica Neue', Helvetica, Arial, 'PingFang SC', 'Hiragina Sans GB', 'WenQuanYi Micro Hei', 'microsoft yahei ui', 'microsoft yahei', sans-serif; 
} 
body { 
    box-sizing: border-box; 
} 
input, p { 
    padding: 0; 
    margin: 0; 
} 
input:disabled,select:disabled,textarea:disabled{ 
    background-color: #FFF; 
} 

input:placeholder-shown{ 
    text-overflow: ellipsis; 
} 
textarea{ 
    overflow: auto; 
} 
input:-webkit-autofill, 
textarea:-webkit-autofill, 
select:-webkit-autofill { 
    box-shadow: inset 0 0 0 1000px #fff; 
} 
*,*:before,*:after { 
    box-sizing: inherit; 
} 
::-webkit-scrollbar { 
    width: 8px !important; 
    height: 8px !important; 
    overflow:visible; 
} 
::-webkit-scrollbar-thumb { 
    min-height: 28px; 
    height: 5px; 
    min-width: 2px; 
    width: 5px; 
    border-radius: 4px; 
    border: dashed transparent; 
    padding: 100px 0 0; 
    border-width: 1px; 
    background-color: #B2B2B2; 
    background-clip: padding-box; 
} 
::-webkit-scrollbar-thumb:hover{ 
    background:#999999; 
    border-radius: 6; 
} 
::-webkit-scrollbar-thumb:active{ 
    background-color:#999999; 
} 
::-webkit-scrollbar-corner{ 
    background:transparent; 
} 
::-webkit-scrollbar-track { 
    border-radius: 10px; 
} 
::-webkit-scrollbar-button{ 
    width:0; 
    height:0; 
} 
:focus{ 
    outline: none; 
} 
ul, li { 
    margin: 0px; 
    padding: 0px; 
    list-style-type: none; 
}`;
} else {
    style.textContent = `
* { 
    -webkit-tap-highlight-color: transparent; 
} 
html,body { 
    padding: 0; 
    margin: 0; 
    height: 100%; 
    overflow: hidden; 
    font-size: 14px; 
    --kdds-base-font-size: 14; 
    font-family:-apple-system, BlinkMacSystemFont, "PingFang SC","Helvetica Neue",STHeiti,"Microsoft Yahei",Tahoma,Simsun,sans-serif; 
    -webkit-tap-highlight-color: transparent 
} 

body { 
    box-sizing: border-box; 
} 
body:hover{ 
    overflow: auto; 
} 
*,*:before,*:after { 
    box-sizing: inherit; 
} 

input:disabled,select:disabled,textarea:disabled{ 
    background-color: #FFF; 
} 

input,textarea{ 
    padding: 0px; 
    margin: 0; 
} 

::-webkit-scrollbar { 
    width: 0px; 
    height: 0px; 
} 
::-webkit-scrollbar-thumb { 
    min-height: 2px; 
    height: 5px; 
    min-width: 2px; 
    width: 5px; 
    background: #b8b8b8; 
    border-radius: 4px; 
    border: none; 
} 
::-webkit-scrollbar-track { 
    border-radius: 10px; 
} 

ul, li { 
    margin: 0px; 
    padding: 0px; 
    list-style-type: none; 
} 

p, 
h4 { 
    padding: 0; 
    margin: 0; 
}`;
}

document.head.appendChild(style);

const element = createElement('kwc-example-component', { is: exampleComponent });
document.body.appendChild(element);
