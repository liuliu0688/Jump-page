// src/js/domain-speed.js
// 域名测速功能

import { startCountdown } from './countdown.js';

/**
 * 解密base64域名
 * @param {Array<string>} domains - Base64编码的域名数组
 * @returns {Array<string>} 解密后的域名数组
 */
function decodeDomains(domains) {
    return domains.map(d => atob(d));
}

/**
 * 测试域名速度
 * @param {Array<string>} domains - 要测试的域名数组
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<Array<Object>>} 包含域名和响应时间的数组
 */
function testDomainSpeed(domains, timeout = 2000) {
    return Promise.all(domains.map(domain => {
        return new Promise(resolve => {
            // 尝试使用fetch API作为主要测速方法
            const start = performance.now();
            let finished = false;
            
            fetch(domain + '/?ping=' + Date.now(), {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store'
            })
            .then(() => {
                if (!finished) {
                    finished = true;
                    resolve({domain, time: performance.now() - start});
                }
            })
            .catch(() => {
                // 如果fetch失败，回退到图片测速方法
                const img = new Image();
                img.onload = () => {
                    if (!finished) {
                        finished = true;
                        resolve({domain, time: performance.now() - start});
                    }
                };
                img.onerror = () => {
                    if (!finished) {
                        finished = true;
                        resolve({domain, time: Infinity});
                    }
                };
                img.src = domain + "/favicon.ico?_t=" + Math.random();
            });
            
            setTimeout(() => {
                if (!finished) {
                    finished = true;
                    resolve({domain, time: Infinity});
                }
            }, timeout);
        });
    }));
}

/**
 * 选择最快的域名
 * @param {Array<Object>} results - 测试结果数组
 * @returns {string} 最快的域名
 */
function selectFastestDomain(results) {
    results.sort((a, b) => a.time - b.time);
    return results[0].domain;
}

/**
 * 测试域名并启动倒计时
 * @param {Array} domains - 域名列表
 * @param {string} targetPath - 目标路径
 * @param {number} countdown - 倒计时秒数
 * @returns {Promise<Array>} 域名测速结果数组
 */
async function testDomains(domains, targetPath, countdown) {
    // 测试域名速度
    const results = await testDomainSpeed(domains);
    console.log('域名测速结果:', results);
    
    // 选择最快的域名
    const fastest = selectFastestDomain(results);
    console.log('最快的域名:', fastest);
    
    // 构造目标URL
    let targetUrl = fastest;
    
    // 如果有目标路径，添加到目标URL
    if (targetPath) {
        // 确保目标URL以斜杠结尾
        if (!targetUrl.endsWith('/')) {
            targetUrl += '/';
        }
        // 移除目标路径开头的斜杠（如果有）
        const cleanPath = targetPath.startsWith('/') ? targetPath.substring(1) : targetPath;
        targetUrl += cleanPath;
    }
    
    // 启动倒计时，传递域名测速结果
    startCountdown(targetUrl, countdown, results);
    
    // 返回测速结果
    return results;
}

// 导出函数
export { decodeDomains, testDomainSpeed, selectFastestDomain, testDomains };