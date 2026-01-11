export default function PrivacyPolicy() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-4xl flex-col items-center py-16 px-4 sm:px-8 lg:px-16 bg-white dark:bg-black">
                {/* Header Section */}
                <div className="flex flex-col items-center gap-4 text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
                        プライバシーポリシー
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        最終更新日: 2026年1月10日
                    </p>
                </div>

                {/* Content Section */}
                <div className="w-full max-w-3xl prose prose-zinc dark:prose-invert prose-headings:font-semibold prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pt-8 prose-h2:border-t prose-h2:border-zinc-200 dark:prose-h2:border-zinc-800 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:leading-relaxed prose-li:text-zinc-600 dark:prose-li:text-zinc-400">
                    
                    <p className="text-lg leading-8">
                        ChatShare(以下「当アプリ」)をご利用いただきありがとうございます。
                    </p>
                    <p className="text-lg leading-8">
                        本プライバシーポリシーは、当アプリにおける個人情報の取り扱いについて説明するものです。
                    </p>

                    <h2 className="mt-4">1. 運営者情報</h2>
                    <ul>
                        <li>サービス名: ChatShare</li>
                        <li>運営者: ChatShare運営係</li>
                        <li>連絡先: support@chatshare.dev</li>
                    </ul>

                    <h2 className="mt-4">2. 収集する情報</h2>
                    <p>当アプリは、以下の情報を収集します。</p>

                    <h3 className="mt-2">2.1 アカウント情報</h3>
                    <p>当アプリでは、以下のいずれかの方法でログインしていただきます:</p>
                    
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg my-4">
                        <p className="font-semibold text-black dark:text-zinc-50">Googleアカウント経由でのログイン</p>
                        <ul>
                            <li>メールアドレス</li>
                            <li>名前</li>
                            <li>プロフィール画像</li>
                            <li>Google ID</li>
                        </ul>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg my-4">
                        <p className="font-semibold text-black dark:text-zinc-50">LINEアカウント経由でのログイン</p>
                        <ul>
                            <li>LINE ID</li>
                            <li>表示名</li>
                            <li>プロフィール画像</li>
                        </ul>
                    </div>

                    <p>これらの情報は、OAuth 2.0プロトコルを使用して取得されます。パスワードは当アプリのサーバーに保存されません。</p>

                    <h3 className="mt-2">2.2 デバイス情報</h3>
                    <ul>
                        <li>デバイスの種類(iOS/Android)</li>
                        <li>OSバージョン</li>
                        <li>アプリバージョン</li>
                        <li>デバイスの言語設定</li>
                        <li>タイムゾーン</li>
                    </ul>

                    <h3 className="mt-2">2.3 利用情報</h3>
                    <ul>
                        <li>アプリの利用状況</li>
                        <li>機能の使用履歴</li>
                        <li>アプリ内での操作履歴</li>
                        <li>エラーログ</li>
                    </ul>

                    <h2 className="mt-4">3. 情報の利用目的</h2>
                    <p>収集した情報は、以下の目的で使用されます:</p>
                    <ul>
                        <li>ユーザー認証とアカウント管理</li>
                        <li>サービスの提供、維持、改善</li>
                        <li>ユーザーサポートの提供</li>
                        <li>アプリのパフォーマンス分析と最適化</li>
                        <li>不正利用の防止とセキュリティの維持</li>
                        <li>新機能の開発と改善</li>
                        <li>法令に基づく義務の履行</li>
                    </ul>

                    <h2 className="mt-4">4. 第三者サービスの利用</h2>
                    <p>当アプリは、以下の第三者サービスを利用しています。これらのサービスは独自のプライバシーポリシーを持っています:</p>

                    <h3 className="mt-2">4.1 Google Sign-In</h3>
                    <ul>
                        <li>提供者: Google LLC</li>
                        <li>使用目的: ユーザー認証</li>
                        <li>
                            プライバシーポリシー:{" "}
                            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                https://policies.google.com/privacy
                            </a>
                        </li>
                    </ul>

                    <h3 className="mt-2">4.2 LINE Login</h3>
                    <ul>
                        <li>提供者: LINE株式会社</li>
                        <li>使用目的: ユーザー認証</li>
                        <li>
                            プライバシーポリシー:{" "}
                            <a href="https://line.me/ja/terms/policy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                https://line.me/ja/terms/policy/
                            </a>
                        </li>
                    </ul>

                    <h2 className="mt-4">4. 情報の保存と管理</h2>
                    <ul>
                        <li>収集した情報は、適切なセキュリティ対策を講じた上で保管されます</li>
                        <li>データは暗号化されて送信され、安全なサーバーに保存されます</li>
                        <li>アクセス権限は必要最小限に制限されています</li>
                        <li>定期的なセキュリティ監査を実施しています</li>
                    </ul>

                    <h2 className="mt-4">5. 情報の共有と開示</h2>
                    <p>当アプリは、以下の場合を除き、収集した情報を第三者に提供することはありません:</p>
                    <ul>
                        <li>ユーザーの同意がある場合</li>
                        <li>法令に基づく開示が必要な場合</li>
                        <li>人の生命、身体または財産の保護のために必要な場合</li>
                        <li>サービスの提供に必要な業務委託先(適切な契約のもと)</li>
                    </ul>

                    <h2 className="mt-4">6. ユーザーの権利</h2>
                    <p>ユーザーは、以下の権利を有します:</p>
                    <ul>
                        <li><strong>アクセス権</strong>: 自分の個人情報へのアクセスを要求できます</li>
                        <li><strong>訂正権</strong>: 不正確な個人情報の訂正を要求できます</li>
                        <li><strong>削除権</strong>: 個人情報の削除を要求できます(アカウント削除)</li>
                        <li><strong>データポータビリティ権</strong>: データの提供を要求できます</li>
                        <li><strong>異議申し立て権</strong>: データ処理に異議を申し立てることができます</li>
                    </ul>
                    <p>これらの権利を行使するには、[連絡先メールアドレス]までご連絡ください。</p>

                    <h2 className="mt-4">7. アカウントの削除</h2>
                    <p>アカウントを削除する場合:</p>
                    <ol>
                        <li>アプリ内の設定画面から「アカウント削除」を選択</li>
                        <li>または[連絡先メールアドレス]まで削除依頼をご連絡ください</li>
                    </ol>
                    <p>アカウント削除後、関連する個人情報は30日以内に削除されます。ただし、法令に基づき保持が必要な情報は除きます。</p>

                    <h2 className="mt-4">8. Cookie・トラッキング技術</h2>
                    <p>当アプリは、サービスの改善とパフォーマンス分析のため、以下の技術を使用します:</p>
                    <ul>
                        <li>セッション管理のためのトークン</li>
                        <li>分析のための匿名化された使用データ</li>
                        <li>アプリの動作に必要な技術的情報</li>
                    </ul>

                    <h2 className="mt-4">9. 子どもの個人情報</h2>
                    <p>当アプリは、13歳未満のお子様を対象としたサービスではありません。13歳未満のお子様が個人情報を提供したことが判明した場合、速やかに削除いたします。</p>

                    <h2 className="mt-4">10. 国際的なデータ転送</h2>
                    <p>収集された情報は、サービス提供のため、日本国外のサーバー(主にGoogleのデータセンター)に転送・保存される場合があります。これらのサーバーは、適切なセキュリティ対策が講じられています。</p>

                    <h2 className="mt-4">11. データ保持期間</h2>
                    <ul>
                        <li>アカウント情報: アカウント削除まで</li>
                        <li>利用履歴: 最大2年間</li>
                        <li>ログデータ: 最大90日間</li>
                        <li>バックアップデータ: 最大30日間</li>
                    </ul>

                    <h2 className="mt-4">12. プライバシーポリシーの変更</h2>
                    <p>当アプリは、必要に応じて本プライバシーポリシーを変更することがあります。重要な変更がある場合は、アプリ内通知またはメールでお知らせします。</p>

                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg mt-12 mb-8 border border-purple-200 dark:border-purple-800">
                        <h3 className="text-lg font-bold text-black dark:text-zinc-50 mt-0">同意について</h3>
                        <p className="mb-0">当アプリを使用することにより、本プライバシーポリシーに同意したものとみなされます。</p>
                    </div>
                </div>

                {/* Back to Home Button */}
                <div className="mt-8 mb-8">
                    <a
                        href="/welcome"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-300 to-blue-300 text-white px-8 py-4 rounded-lg font-semibold hover:from-purple-400 hover:to-blue-400 transition shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        ホームに戻る
                    </a>
                </div>
            </main>
        </div>
    );
}
