// ==UserScript==
// @name         X（Twitter）フォロー/アンフォロー誤操作防止（ホバーカード内）
// @namespace    https://zeroban-noriba.com/
// @version      2.0
// @description  ホバーカード、プロフィール欄、ツイートメニューのフォロー/アンフォローボタンを無効化して誤クリックを防止
// @match        https://*.x.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ボタンを無効化する関数
    function disableFollowButtons() {
        // ホバーカード内のフォロー関連ボタンを取得
        const hoverCards = document.querySelectorAll('[data-testid="hoverCardParent"]');
        let hoverCardButtons = [];

        hoverCards.forEach(hoverCard => {
            const followButtons = hoverCard.querySelectorAll('button[data-testid$="-follow"]');
            const unfollowButtons = hoverCard.querySelectorAll('button[data-testid$="-unfollow"]');
            hoverCardButtons.push(...followButtons, ...unfollowButtons);
        });

        // プロフィール欄のフォロー関連ボタンを取得
        // プロフィールページや埋め込みプロフィール内のボタンを対象とする
        const profileFollowButtons = document.querySelectorAll('button[data-testid$="-follow"]:not([data-testid*="hoverCard"])');
        const profileUnfollowButtons = document.querySelectorAll('button[data-testid$="-unfollow"]:not([data-testid*="hoverCard"])');

        // ツイートメニュー内のフォロー/フォロー解除オプションを取得
        // role="menuitem"でフォロー関連のテキストを持つ要素を検出
        const menuItems = document.querySelectorAll('[role="menuitem"]');
        let menuFollowItems = [];

        menuItems.forEach(item => {
            const text = item.textContent || '';
            // 「フォロー」「フォロー解除」「Follow」「Unfollow」などを検出
            if (text.includes('フォロー') || text.includes('Follow') ||
                text.includes('follow') || text.includes('Unfollow')) {
                // 「フォローする」「フォロー解除」など、実際のフォロー操作のみを対象
                // 「フォロワー」などの他の文言は除外
                if (!text.includes('フォロワー') && !text.includes('Follower') &&
                    !text.includes('Following') && !text.includes('をフォロー中')) {
                    menuFollowItems.push(item);
                }
            }
        });

        // すべてのボタンを統合
        const allButtons = [...hoverCardButtons, ...profileFollowButtons, ...profileUnfollowButtons];

        allButtons.forEach(button => {
            // 既に処理済みかチェック
            if (button.hasAttribute('data-disabled-by-script')) {
                return;
            }

            // 処理済みマークを追加
            button.setAttribute('data-disabled-by-script', 'true');

            // aria-disabled属性をtrueに設定して無効化を示す
            button.setAttribute('aria-disabled', 'true');

            // ボタンの種類を判定
            const isFollowButton = button.getAttribute('data-testid').includes('-follow') && !button.getAttribute('data-testid').includes('-unfollow');
            const buttonType = isFollowButton ? 'フォロー' : 'フォロー解除';

            // ボタンの場所を判定
            const isInHoverCard = button.closest('[data-testid="hoverCardParent"]') !== null;
            const location = isInHoverCard ? 'ホバーカード' : 'プロフィール欄';

            // クリックイベントを無効化
            button.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                alert(`${location}の${buttonType}ボタンは無効化されています。誤操作を防止するため、このボタンは使用できません。`);
            }, { capture: true });

            // 視覚的に無効化を示すためのスタイルを適用
            button.style.opacity = '0.5';
            button.style.pointerEvents = 'none';
            button.style.cursor = 'not-allowed';

            // ツールチップを追加
            button.title = `${location}の${buttonType}ボタンは無効化されています`;
        });

        // メニュー項目の無効化処理
        menuFollowItems.forEach(item => {
            // 既に処理済みかチェック
            if (item.hasAttribute('data-disabled-by-script')) {
                return;
            }

            // 処理済みマークを追加
            item.setAttribute('data-disabled-by-script', 'true');

            // aria-disabled属性をtrueに設定
            item.setAttribute('aria-disabled', 'true');

            // メニュー項目の種類を判定
            const text = item.textContent || '';
            const isFollowItem = text.includes('フォローする') || (text.includes('Follow') && !text.includes('Unfollow'));
            const itemType = isFollowItem ? 'フォロー' : 'フォロー解除';

            // クリックイベントを無効化
            item.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                alert(`メニューの${itemType}オプションは無効化されています。誤操作を防止するため、この項目は使用できません。`);
            }, { capture: true });

            // 視覚的に無効化を示すためのスタイルを適用
            item.style.opacity = '0.5';
            item.style.pointerEvents = 'none';
            item.style.cursor = 'not-allowed';

            // ツールチップを追加
            item.title = `メニューの${itemType}オプションは無効化されています`;
        });
    }

    // DOMの変化を監視して、新しいボタンが追加されたら無効化
    const observer = new MutationObserver(function(mutations) {
        // パフォーマンス向上のため、関連する変更があった場合のみ実行
        let shouldCheck = false;
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // フォロー関連のボタンやホバーカード、メニュー関連の要素が追加された場合
                        if (node.querySelector && (
                            node.querySelector('[data-testid="hoverCardParent"]') ||
                            node.querySelector('button[data-testid$="-follow"]') ||
                            node.querySelector('button[data-testid$="-unfollow"]') ||
                            node.querySelector('[role="menuitem"]') ||
                            node.querySelector('[role="menu"]') ||
                            node.closest('[data-testid="hoverCardParent"]') ||
                            node.closest('[role="menu"]') ||
                            node.matches('[data-testid="hoverCardParent"]') ||
                            node.matches('button[data-testid$="-follow"]') ||
                            node.matches('button[data-testid$="-unfollow"]') ||
                            node.matches('[role="menuitem"]') ||
                            node.matches('[role="menu"]')
                        )) {
                            shouldCheck = true;
                        }
                    }
                });
            }
        });

        if (shouldCheck) {
            disableFollowButtons();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // ページ読み込み完了後に初回実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', disableFollowButtons);
    } else {
        disableFollowButtons();
    }

    // 少し遅延させて再実行（動的コンテンツ対応）
    setTimeout(disableFollowButtons, 1000);
})();