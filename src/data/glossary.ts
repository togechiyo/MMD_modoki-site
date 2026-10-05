export const glossaryGroups = [
  { id: 'camera', name: 'カメラ・視点' },
  { id: 'model', name: 'モデル・ポーズ' },
  { id: 'timeline', name: '時間・キー' },
  { id: 'lighting', name: '照明・影' },
  { id: 'look', name: '材質・エフェクト' },
  { id: 'accessory', name: 'アクセサリ' },
  { id: 'input', name: '数値入力' },
] as const;

interface Term {
  id: string;
  group: (typeof glossaryGroups)[number]['id'];
  name: string;
  aliases: string;
  ui: string;
  where: string;
  meaning: string;
  change: string;
  limits: string;
  note?: string;
  related: string[];
  sources: string[];
  guide?: { slug: string; anchor: string; label: string };
}
export const terms: Term[] = [
  {
    id: 'camera-distance',
    group: 'camera',
    name: 'D・距離',
    aliases: 'distance ズーム カメラ距離',
    ui: '距離（Dと呼ばれる値）',
    where: '「情報 → 対象」でCameraを選択 → 下部のボーン欄',
    meaning:
      '通常のカメラで、注視点からカメラまでの離れ具合です。画面の距離は正の値で扱います。注視点のZ座標とは別の量です。',
    change:
      '注視点・回転・視野角を固定してDを大きくするとカメラが離れ、小さくすると近づきます。透視投影では、同じ被写体が小さく／大きく見えます。',
    limits:
      'v0.2.4の数値欄定義は0.15〜100,000、step 0.1、表示は小数1桁。外部親が有効な場合はD=0になり、この欄は操作できません。シーン距離の単位で、メートル表記ではありません。',
    note: '数値欄から適用する実装は距離の絶対値を取り、MMDカメラ内部には負の符号で渡します。「負にすると反対側へ回る」とは案内できません。EnterごとにDが変化するというIssue #28の報告は、正常なズーム仕様ではありません。',
    related: [
      'camera-target',
      'camera-rotation',
      'camera-fov',
      'camera-parent',
      'input-precision',
    ],
    sources: [
      'src/bottom-panel.ts#L374',
      'src/mmd-manager.ts#L15051',
      'src/mmd-manager.ts#L15312',
      'src/ui/camera-control-limits.ts',
    ],
  },
  {
    id: 'camera-target',
    group: 'camera',
    name: 'X / Y / Z・注視点',
    aliases: '位置Z カメラ位置 target center センター',
    ui: 'X / Y / Z（Camera選択時）',
    where: 'Cameraを選択 → 下部のボーン欄',
    meaning:
      'この欄は、カメラ本体の世界座標ではなく、カメラが向く基準点（注視点）の座標です。Dと回転を組み合わせて実際の視点が決まります。',
    change:
      '外部親なしでDと回転を固定し、Yを上げると構図の中心を上へ移します。Zを変えると注視点をシーンのZ軸に沿って移します。「いつでも画面の奥へズームする」操作ではありません。',
    limits:
      'X・Y・Zはシーン座標の成分です。回転した視点の前後方向と世界のZ軸は一致するとは限りません。v0.2.4の欄定義は各−100,000〜100,000、step 1、表示は小数2桁。',
    note: '外部親がある場合は親に対するカメラの値になり、通常の世界座標と同じ意味で比較できません。モデルの向きや視点を無視して「Zの＋は必ず画面奥」と覚えないでください。',
    related: [
      'camera-distance',
      'camera-rotation',
      'camera-parent',
      'bone-position',
      'input-precision',
    ],
    sources: [
      'src/bottom-panel.ts#L167',
      'src/bottom-panel.ts#L563',
      'src/mmd-manager.ts#L15312',
    ],
  },
  {
    id: 'camera-rotation',
    group: 'camera',
    name: 'Rx / Ry / Rz・カメラ回転',
    aliases: '角度 rotation ロール pitch yaw roll',
    ui: 'Rx / Ry / Rz',
    where: 'Cameraを選択 → 下部のボーン欄',
    meaning:
      '注視点を基準とするカメラの向きです。Rxは上下方向、Ryは左右方向、Rzは画面の傾きに関係します。モデルを回す操作とは異なります。',
    change:
      '注視点とDを固定してRx・Ryを変えると、被写体を見る角度が変わります。Rzを変えると画面を傾けた構図になります。',
    limits:
      '数値欄は度（°）。各−180〜180、step 1、表示は小数1桁というUI定義です。MMD内部の角度には度からラジアンへ変換して渡します。',
    note: '＋方向を画面の右回り／左回りに一律に対応させないでください。別の軸の回転や外部親で見え方が変わります。0°と360°を同じ向きにできても、一回転のモーションが記録される保証はありません。',
    related: [
      'camera-target',
      'camera-distance',
      'bone-rotation',
      'input-precision',
    ],
    sources: [
      'src/bottom-panel.ts#L365',
      'src/mmd-manager.ts#L15312',
      'src/mmd-manager.ts#L15651',
    ],
  },
  {
    id: 'camera-fov',
    group: 'camera',
    name: '視野角・画角（FoV）',
    aliases: 'FOV field of view 広角 望遠',
    ui: '視野角',
    where: 'Cameraを選択 → 下部のボーン欄',
    meaning:
      'カメラが一度に見渡す角度です。距離Dがカメラを近づける／離す量なのに対し、視野角は見渡す広さを変えます。',
    change:
      '透視投影で同じ位置なら、大きくすると広い範囲が入り、小さくすると狭い範囲を大きく写します。Dと視野角を両方変えて同じ大きさに合わせても、遠近感は同じとは限りません。',
    limits: '度（°）。数値欄と適用時の制限は1〜120、step 0.1、表示は小数1桁。',
    note: 'パースOFF時も、この実装ではDと視野角から平行投影の表示範囲を計算します。「OFFなら視野角は無関係」とは扱えません。',
    related: ['camera-distance', 'perspective'],
    sources: [
      'src/ui/camera-control-limits.ts',
      'src/mmd-manager.ts#L15294',
      'src/mmd-manager.ts#L15383',
    ],
  },
  {
    id: 'perspective',
    group: 'camera',
    name: 'パース・透視投影 / 平行投影',
    aliases: 'perspective orthographic 遠近法 投影',
    ui: 'パース',
    where: 'ビューポート上部の「パース」ボタン',
    meaning:
      'ONは透視投影で、遠いものほど小さく見える遠近感を使います。OFFは平行投影で、奥行きによる大きさの差を抑えます。',
    change:
      '同じ構図で切り替えると、手前と奥の大きさの関係が変わります。平行投影は形や配置の比較に便利です。',
    limits:
      'ON / OFF。OFF時の表示範囲もDと視野角から計算されます。数値の単位はありません。',
    note: 'ここで確認したのはビューポートの投影切替です。プロジェクトへの保存と動画出力への反映は保証できません。Issue #28には出力・保存に関する報告があるため、短い出力で結果を確認してください。',
    related: ['camera-fov', 'camera-distance'],
    sources: [
      'index.html#L457',
      'src/mmd-manager.ts#L15271',
      'src/mmd-manager.ts#L15383',
    ],
    guide: { slug: 'workflow', anchor: 'test-export', label: '出力前の確認' },
  },
  {
    id: 'camera-parent',
    group: 'camera',
    name: 'カメラの外部親',
    aliases: '外親 parent 追従 親ボーン',
    ui: '外部親 / 親ボーン / 登録',
    where: 'Camera選択時の下部カメラ用の親設定',
    meaning:
      'カメラを、選んだモデルのボーンに追従させる設定です。通常の独立したカメラと、値の基準が変わります。',
    change:
      '親のボーンが移動・回転するとカメラの視点も追従します。選択しただけではなく、登録して反映する設計です。',
    limits:
      '親モデルと親ボーンを選びます。有効時のDは0固定。解除後は通常のカメラとして扱います。',
    note: '通常カメラのDによるズームを、この状態へそのまま当てはめないでください。親のアニメーションと合わせて短く再生して確認します。',
    related: [
      'camera-distance',
      'camera-target',
      'accessory-parent',
      'keyframe',
    ],
    sources: [
      'src/ui/camera-panel-controller.ts#L143',
      'src/mmd-manager.ts#L15237',
      'src/mmd-manager.ts#L15073',
    ],
  },
  {
    id: 'model',
    group: 'model',
    name: 'モデル・編集対象',
    aliases: 'PMX PMD BPMX 対象 active model',
    ui: '情報 → 対象',
    where: '下部の「情報」欄',
    meaning:
      '形・材質・ボーン・モーフなどを含む読込対象です。同じモデルを複数読み込んだ場合も、編集する一体を選びます。',
    change:
      '対象を切り替えると、表示するボーン・モーフ・モーションの編集先が変わります。モデル全体の移動と、一つのボーンの移動は区別します。',
    limits:
      'モデルの寸法は素材の作り方に依存します。シーンの1を、すべてのモデルで1メートルと断定できません。',
    related: ['bone', 'morph', 'material', 'keyframe'],
    sources: ['index.html#L726', 'src/bottom-panel.ts'],
    guide: { slug: 'formats', anchor: 'models', label: 'モデル形式と読み込み' },
  },
  {
    id: 'bone',
    group: 'model',
    name: 'ボーン',
    aliases: '骨 skeleton センター グルーブ 足IK',
    ui: 'ボーン / ボーン操作',
    where: 'モデルのタイムライン、3D表示、下部のボーン欄',
    meaning:
      'モデルの姿勢や動きを制御する骨組みです。親子関係があり、親を動かすと子の位置や向きにも影響します。',
    change:
      '選択ボーンの位置・回転を変えると、対応する体の部分や配下のボーンが動きます。移動や回転を許可しないボーンでは、その数値欄が無効になります。',
    limits:
      '使えるボーン名と編集可能な軸・動きはモデル側の設定によります。「センター」は全モデル共通の固定機能名ではありません。',
    related: ['bone-position', 'bone-rotation', 'ik', 'physics'],
    sources: ['src/bottom-panel.ts#L340', 'src/mmd-manager.ts#L14890'],
  },
  {
    id: 'bone-position',
    group: 'model',
    name: 'ボーンのX / Y / Z',
    aliases: '移動 translation 位置 座標',
    ui: 'X / Y / Z（モデルのボーン選択時）',
    where: '下部のボーン欄',
    meaning:
      'ボーンの初期位置からの移動量です。親に対するローカル位置へ初期位置と移動量を加える実装で、カメラの注視点や世界座標の位置とは意味が違います。',
    change:
      '選択ボーンを各軸へ移します。親の回転がある場合、数値の軸方向と画面上の上下左右は一致するとは限りません。',
    limits:
      'v0.2.4タグの欄定義は各−100,000〜100,000、step 1、表示は小数2桁。移動が許可されないボーンは入力不可。素材のシーン単位です。',
    note: '表示桁数は内部値の精度を保証するものではありません。細かい値や範囲外の値を読込済みの場合の再入力は、数値入力の注意も確認してください。',
    related: ['bone', 'bone-rotation', 'camera-target', 'input-precision'],
    sources: [
      'src/bottom-panel.ts#L365',
      'src/ui/transform-control-limits.ts',
      'src/mmd-manager.ts#L14890',
    ],
  },
  {
    id: 'bone-rotation',
    group: 'model',
    name: 'ボーンのRx / Ry / Rz',
    aliases: 'rotation 角度 回転 クォータニオン',
    ui: 'Rx / Ry / Rz（モデルのボーン選択時）',
    where: '下部のボーン欄',
    meaning:
      'ボーンのローカル回転を、3つの角度として表示・入力する欄です。内部ではクォータニオンという回転表現へ変換します。',
    change:
      '選択ボーンの姿勢を各軸まわりに変えます。複数軸を組み合わせると、単純な一軸回転とは見え方が異なります。',
    limits:
      '度（°）。欄定義は各−180〜180、step 1、表示は小数1桁。回転を許可しないボーンは入力不可。',
    note: '同じ姿勢でも角度表記が違う場合があります。±180°をまたぐ動きや一回転を、角度の大小だけで判断しないでください。',
    related: ['bone-position', 'interpolation', 'input-precision'],
    sources: ['src/bottom-panel.ts#L369', 'src/mmd-manager.ts#L14903'],
  },
  {
    id: 'morph',
    group: 'model',
    name: 'モーフ・表情のウェイト',
    aliases: 'morph weight あ 笑い まばたき',
    ui: 'モーフ（各モーフ名のスライダー）',
    where: '下部のモーフ欄',
    meaning:
      'モデルに用意された形や材質の変化を、どの程度適用するかを表す値です。顔の表情だけでなく、頂点・ボーン・材質などの変化も含みます。',
    change:
      '0はそのモーフの効果なし、1は定義された変化を全量適用します。複数を組み合わせると変化が重なり、意図しない形になることもあります。',
    limits:
      '通常のUIスライダーは0〜1、step 0.01、表示は小数2桁。無単位のウェイトです。内容・名前・カテゴリはモデル次第です。',
    note: 'スライダーでプレビューしただけではキー登録とは別です。残したいフレームで登録結果を確認します。',
    related: ['model', 'keyframe', 'interpolation'],
    sources: ['src/bottom-panel.ts#L714', 'src/bottom-panel.ts#L746'],
  },
  {
    id: 'ik',
    group: 'model',
    name: 'IK（逆運動学）',
    aliases: 'inverse kinematics 足 連動 IK ON OFF',
    ui: 'IK ON・OFF',
    where: 'モデルのプロパティ設定（IKを持つモデル）',
    meaning:
      '足先などの目標から、途中の関節の曲がり方を計算する仕組みです。ボーンを一つずつ回す方法とは異なります。',
    change:
      'ONではIKの目標に合わせて関連ボーンが動きます。OFFではそのIKによる計算を止めるため、同じモーションでも姿勢が変わることがあります。',
    limits:
      'ON / OFF。対象となるIKや関節の制約はモデル定義によります。表示・IKのキーは連続補間ではなく、直前のキー状態を維持する方式です。',
    related: ['bone', 'physics', 'keyframe'],
    sources: [
      'language/ja.json#L130',
      'src/mmd-manager.ts#L4820',
      'docs/timeline-spec.md#L281',
    ],
  },
  {
    id: 'physics',
    group: 'model',
    name: '物理演算・剛体',
    aliases: 'physics Bullet 髪 布 スカート ジョイント',
    ui: '物理 / 物理演算 / 剛体を表示',
    where: '上部の物理ボタン、物理演算メニュー',
    meaning:
      'モデルに定義された剛体やジョイントを使い、揺れや衝突を計算します。ボーンの手動編集やIKとは別の仕組みです。',
    change:
      'ONでは対応する髪や服などが計算で動きます。OFFとの比較は、モーション由来の動きと物理由来の揺れを切り分ける助けになります。',
    limits:
      '利用できるかは物理の初期化と実行環境に依存します。全モデルの全ボーンが物理対象になるわけではありません。',
    note: '物理姿勢は過去の計算履歴にも依存します。途中へ直接移動した結果と、最初から連続再生した結果の完全一致を保証できません。出力前に短く再生・出力して確認します。',
    related: ['ik', 'gravity', 'frame'],
    sources: [
      'docs/physics-runtime-spec.md#L40',
      'docs/physics-runtime-spec.md#L73',
      'language/ja.json#L929',
    ],
    guide: {
      slug: 'workflow',
      anchor: 'test-export',
      label: '再生・出力の確認',
    },
  },
  {
    id: 'gravity',
    group: 'model',
    name: '重力の加速度・X / Y / Z',
    aliases: 'gravity 方向 下向き',
    ui: '重力 → 加速度 / 重力X / 重力Y / 重力Z',
    where: '下部の重力欄',
    meaning:
      '加速度は重力の強さ、X/Y/Zは向きです。方向の3成分は、適用時に長さを揃えてから加速度を掛けます。',
    change:
      '加速度を大きくすると引かれる強さを増やします。Yを負にした下向き設定など、方向を変えると揺れものの引かれる向きが変わります。',
    limits:
      'UI定義は加速度0〜200、方向各−100〜100、step 1。物理用の値で、ここではSI単位のm/s²とは断定しません。',
    note: '方向を全成分0にする操作は、通常の向き調整として推奨しません。重力キーを変えても、過去の物理計算が不要になるわけではありません。',
    related: ['physics', 'keyframe', 'light-direction'],
    sources: ['index.html#L1103', 'docs/physics-runtime-spec.md#L73'],
  },
  {
    id: 'frame',
    group: 'timeline',
    name: 'フレーム',
    aliases: 'frame 時間 秒 30fps シーク',
    ui: '現在フレーム / タイムライン',
    where: 'タイムラインと再生欄',
    meaning:
      'モーションの時間位置を示す番号です。シークは再生位置を移動する操作で、キーを移動する操作とは異なります。',
    change:
      '番号を変えるとその時点の姿勢・カメラなどを表示します。30フレーム刻みの時間軸なら30フレームが1秒に相当します。出力FPSや画面の描画FPSとは区別します。',
    limits:
      '基本は0以上のフレーム番号。音源なしの再生は30fps換算で進む実装です。再生範囲の終端と、出力範囲の指定は別に確認してください。',
    related: ['keyframe', 'track', 'fps', 'physics'],
    sources: ['docs/timeline-spec.md#L121', 'docs/timeline-spec.md#L226'],
  },
  {
    id: 'track',
    group: 'timeline',
    name: 'トラック・対象の行',
    aliases: 'track タイムライン 行 選択',
    ui: 'タイムラインの各行',
    where: 'ボーン・モーフ・カメラ・照明などのタイムライン',
    meaning:
      'どの対象の変化を扱うかを分ける行です。行を選ぶことと、その行のキー点を選ぶことは別です。',
    change:
      '行を選ぶと編集対象や補間表示が変わります。キー点を選ぶと、移動・コピー・削除などの対象になります。',
    limits:
      'モデル用とCamera用などで対象が分かれます。空白の区切り行はキー登録の対象ではありません。',
    related: ['frame', 'keyframe', 'interpolation'],
    sources: ['docs/timeline-spec.md#L18', 'docs/timeline-spec.md#L98'],
  },
  {
    id: 'keyframe',
    group: 'timeline',
    name: 'キー・キーフレーム登録',
    aliases: 'keyframe 登録 キー点 保存 Auto Enter',
    ui: '登録 / 各欄のキーフレーム登録ボタン',
    where: 'タイムラインと下部の各編集欄',
    meaning:
      'あるフレームの位置・回転・表情などをモーションに残す点です。数値入力の確定、キー登録、プロジェクト保存は別の操作です。',
    change:
      '現在フレームに登録すると、その対象の値を記録します。同じフレームへの再登録は既存の値を更新します。別のフレームにキーを置くと、その間の動きを作れます。',
    limits:
      '登録先は選択中の対象・トラックに依存します。数値欄にフォーカス中のEnterは入力確定用なので、キーができたかはタイムラインで確認します。',
    note: 'すべての値を標準VMDに保存できるわけではありません。照明・影・重力・アクセサリなどの編集状態は、プロジェクト保存も使って残してください。',
    related: ['frame', 'track', 'interpolation', 'input-commit'],
    sources: [
      'docs/timeline-spec.md#L187',
      'src/ui/panel-control-helpers.ts#L288',
    ],
    guide: {
      slug: 'formats',
      anchor: 'project',
      label: 'プロジェクトとモーション形式',
    },
  },
  {
    id: 'interpolation',
    group: 'timeline',
    name: '補間・線形・補間カーブ',
    aliases: 'interpolation bezier ベジェ 加速 減速',
    ui: '補間 → 種別 / 線形',
    where: '下部の補間欄（トラックとキーを選択）',
    meaning:
      '隣り合うキーの間を、どの速さの変化でつなぐかという設定です。始点・終点の姿勢を変える設定とは異なります。',
    change:
      '線形は時間に対して均等に値を変える基準です。カーブを変えると、動き始めや終わりの加速・減速の仕方を変えられます。',
    limits:
      'カメラはX/Y/Z・回転・距離・FoVのチャンネルを扱います。アクセサリの位置・回転・スケールは線形評価。表示・IKは状態の切替で、カーブ補間とは異なります。',
    note: '選んだ種類とキーを確認してから編集します。回転の補間と位置の補間を同じ数値の足し算として考えないでください。',
    related: [
      'keyframe',
      'camera-distance',
      'bone-rotation',
      'accessory-scale',
    ],
    sources: [
      'index.html#L803',
      'docs/timeline-spec.md#L104',
      'docs/timeline-spec.md#L255',
      'docs/timeline-spec.md#L281',
    ],
  },
  {
    id: 'fps',
    group: 'timeline',
    name: 'FPS・出力FPS・物理の演算レート',
    aliases: 'フレームレート Hz レンダリング 速度',
    ui: 'FPS / 動画出力のFPS / 物理演算詳細 → 演算レート',
    where: '表示の統計、出力設定、物理演算の詳細設定',
    meaning:
      '画面FPSは表示速度、出力FPSは動画の1秒あたりの画像数、物理の演算レートは計算の刻みです。同じ「1秒あたり」でも役割が違います。',
    change:
      '出力FPSを変えると動画のフレーム数や滑らかさが変わります。表示FPSが低いことだけで、完成動画の再生速度が遅くなるとは限りません。',
    limits:
      'FPSはframes per second、Hzは1秒あたりの回数。具体的な出力設定は形式ガイドで確認してください。',
    related: ['frame', 'physics'],
    sources: [
      'docs/timeline-spec.md#L226',
      'docs/physics-runtime-spec.md#L79',
      'language/ja.json#L1032',
    ],
    guide: { slug: 'formats', anchor: 'webm', label: '動画出力の設定' },
  },
  {
    id: 'light-direction',
    group: 'lighting',
    name: '照明の方向X / Y / Z',
    aliases: 'light direction 光源 ベクトル 太陽',
    ui: '照明 → 方向X / 方向Y / 方向Z',
    where: '下部の照明欄',
    meaning:
      '方向光が進む向きの3成分です。光源をX/Y/Zの地点へ置く座標ではありません。',
    change:
      '方向を変えると、明るい面と影の落ち方が変わります。まず一成分だけ小さく変えて顔や床の影を比較すると、向きの違いを把握しやすくなります。',
    limits:
      'UIは各−1〜1、step 0.01。角度（°）でも距離でもなく、無単位の方向成分です。',
    note: 'モデルの材質やシェーダーにより効き方が違います。光の進む向きと、光源がある側を逆に覚えないようにしてください。',
    related: ['light-color', 'shadow', 'material'],
    sources: [
      'index.html#L943',
      'src/ui-controller.ts#L1450',
      'src/scene/light-shadow-controller.ts#L738',
    ],
  },
  {
    id: 'light-color',
    group: 'lighting',
    name: '照明R / G / B',
    aliases: 'RGB 赤 緑 青 色 明るさ light color',
    ui: '照明R / 照明G / 照明B',
    where: '下部の照明欄',
    meaning:
      '照明の赤・緑・青の寄与です。材質そのものの色や、画面全体を色調整するLUTとは別です。',
    change:
      'Rを増やすと赤の寄与が増えます。3成分を同程度に増減すると、色の偏りを抑えて照明の寄与を変えられます。',
    limits:
      'UIスライダー内部は0〜255、step 1ですが、表示は0〜200%です。実装は値を127.5で割って適用するため、照明の128はおよそ100%です。',
    note: '影R/G/Bと同じ「128」でも意味が違います。画面の%表示を見て比較してください。材質やトーン処理で出力色は変わります。',
    related: ['shadow', 'material', 'post-effect'],
    sources: ['index.html#L966', 'src/ui-controller.ts#L1520'],
  },
  {
    id: 'shadow',
    group: 'lighting',
    name: '影R / G / B・Toon・強度',
    aliases: 'shadow 影色 セルフ影 toon トゥーン',
    ui: '影 → 影R / 影G / 影B / Toon / 強度',
    where: '下部の影欄',
    meaning:
      '影側の色とtoonの影色反映を扱います。「強度」は方向光の強度に接続する欄で、単純な影の不透明度とは異なります。',
    change:
      '影RGBは影側の色味を変え、Toonはその影色の反映度を変えます。強度を上げると方向光の強さが変わるため、明るい面も含めて比較します。',
    limits:
      '影RGBは各0〜255を0〜1の色成分へ変換。Toonは0〜100%。強度はUI値0〜200を0〜2へ変換して適用。材質の経路によって効き方が異なります。',
    note: 'モデルが自身へ落とすセルフ影、床へ落とす影、SSAOの接触部分の陰影は同じ処理ではありません。まとめて「影が濃い／薄い」だけで調整しないでください。',
    related: ['light-direction', 'light-color', 'shadow-range', 'post-effect'],
    sources: [
      'index.html#L994',
      'index.html#L1084',
      'src/ui-controller.ts',
      'src/scene/light-shadow-controller.ts#L403',
    ],
    guide: { slug: 'effects', anchor: 'materials', label: '材質と影の表現' },
  },
  {
    id: 'shadow-range',
    group: 'lighting',
    name: '影の範囲',
    aliases: 'shadow maxZ 距離 描画範囲',
    ui: '影 → 範囲',
    where: '下部の影欄',
    meaning:
      '影を計算する距離範囲に関係する設定です。モデルやカメラを遠くへ移動するための座標ではありません。',
    change:
      '広いシーンでは範囲を広げると遠方の影を扱える場合がありますが、影の精細さや安定性との兼ね合いがあります。小さなシーンでむやみに大きくしないようにします。',
    limits:
      'UI定義は500〜10,000、step 500。シーン距離の値です。通常影とカスケード影の経路により影への反映が変わります。',
    related: ['shadow', 'camera-distance'],
    sources: ['index.html#L1020', 'src/scene/light-shadow-controller.ts'],
  },
  {
    id: 'material',
    group: 'look',
    name: '材質・シェーダー・プリセット',
    aliases: 'material shader toon sphere テクスチャ',
    ui: 'Effect → 材質',
    where: '右側のEffectパネル → 材質タブ',
    meaning:
      '材質はモデルの各部分の色・質感など、シェーダーはそれを描く処理です。プリセットは表現を選びやすくまとめた設定です。',
    change:
      'プリセットを選んで適用すると、対象材質の光や影の表現が変わります。「選択材質に適用」と「全材質に適用」は対象範囲が違います。',
    limits:
      '使える表現は通常MMD材質と実験的PBRなどの経路で異なります。テクスチャやモデル本来の設定も結果に影響します。',
    related: ['model', 'light-color', 'post-effect'],
    sources: ['index.html#L622', 'src/ui/shader-panel-controller.ts'],
    guide: {
      slug: 'effects',
      anchor: 'materials',
      label: '材質プリセットの選び方',
    },
  },
  {
    id: 'post-effect',
    group: 'look',
    name: 'ポストエフェクト・スタック',
    aliases: 'post effect Bloom DoF SSAO SSR LUT ブルーム 被写界深度',
    ui: 'Effect → 効果（ツールチップ：ポストエフェクト）',
    where: '右側のEffectパネル',
    meaning:
      '材質を描いた後の画面に、にじみ・ぼかし・色調整などを加える処理です。スタックは追加した効果の並びです。',
    change:
      '効果を追加・ON/OFF・調整すると画面の仕上がりが変わります。ひとつずつ追加して、素材・照明由来の変化と区別します。',
    limits:
      '各効果の単位・負荷・使い方はエフェクトガイドへ。通常UIですべての効果をキー登録できるわけではありません。MMEの.fxをそのまま読み込む機能ではありません。',
    related: ['material', 'fps'],
    sources: ['index.html#L626', 'src/editor/effect-timeline-availability.ts'],
    guide: {
      slug: 'effects',
      anchor: 'effect-search',
      label: '20種類の効果を探す',
    },
  },
  {
    id: 'accessory-position',
    group: 'accessory',
    name: 'アクセサリのX / Y / Z',
    aliases: 'accessory .x OBJ 座標 位置 移動',
    ui: 'アクセサリー → X / Y / Z',
    where: '情報の対象でアクセサリを選択 → 下部のアクセサリー欄',
    meaning:
      '選択アクセサリの移動位置です。Worldを親にする場合と、モデルのボーンを親にする場合で基準が変わります。',
    change:
      '各成分を変えるとアクセサリを対応する軸へ移動します。親が動いている場合は親の動きも重なります。',
    limits:
      'v0.2.4のUI定義は各−100〜100、step 1、表示は小数1桁。これは数値欄の範囲で、全入力形式や内部座標の上限を保証するものではありません。',
    note: '範囲外の値が数値欄では制限され、再確定で置き換わるという報告があります。ドラッグで遠くへ置けたことを、キー登録後も同じ位置になる保証として扱わないでください。',
    related: ['accessory-parent', 'accessory-rotation', 'input-precision'],
    sources: [
      'src/ui/accessory-panel-controller.ts#L259',
      'src/ui/accessory-panel-controller.ts#L476',
    ],
  },
  {
    id: 'accessory-rotation',
    group: 'accessory',
    name: 'アクセサリのRx / Ry / Rz',
    aliases: 'accessory rotation 回転 角度',
    ui: 'アクセサリー → Rx / Ry / Rz',
    where: '下部のアクセサリー欄',
    meaning:
      '選択アクセサリを各軸まわりに回す角度です。親がある場合は親側の姿勢も見た目へ影響します。',
    change:
      'アクセサリの向きを変えます。最初は一軸ずつ少量変え、位置と回転を同時に変えすぎないと変化を把握しやすくなります。',
    limits:
      '度（°）。数値欄は各−180〜180、step 1、表示は小数1桁。変形トラックは線形補間です。',
    note: '360°の回転量をこの欄で入力する設計ではありません。同じ最終姿勢を作れることと、一回転の軌跡を保存できることは別です。',
    related: ['accessory-position', 'accessory-parent', 'interpolation'],
    sources: [
      'src/ui/accessory-panel-controller.ts#L264',
      'docs/timeline-spec.md#L255',
    ],
  },
  {
    id: 'accessory-scale',
    group: 'accessory',
    name: 'Si・アクセサリの拡縮',
    aliases: 'scale サイズ 倍率 スケール 大きさ',
    ui: 'Si',
    where: '下部のアクセサリー欄',
    meaning:
      'アクセサリ全体の一様な倍率です。X/Y/Zを個別に伸ばす非一様スケールの欄ではありません。',
    change:
      '1は読込時の基準サイズ、2は各方向が2倍、0.5は各方向が半分になります。素材自体の寸法が違えば、同じSiでも同じ大きさにはなりません。',
    limits:
      '無単位の倍率。数値欄は0.01〜50、step 0.01、表示は小数2桁まで。負の倍率による反転を案内する欄ではありません。',
    related: ['accessory-position', 'interpolation'],
    sources: [
      'src/ui/accessory-panel-controller.ts#L267',
      'src/ui/accessory-panel-controller.ts#L508',
    ],
  },
  {
    id: 'accessory-parent',
    group: 'accessory',
    name: '親・World・親ボーン',
    aliases: 'parent ワールド 外部親 attach 手に持つ',
    ui: '親 / ボーン',
    where: '下部のアクセサリー欄の親設定',
    meaning:
      'アクセサリの配置をどこに結び付けるかという設定です。Worldはシーン側、モデルとボーンを選ぶとその骨組みに追従させます。',
    change:
      '手のボーンに結び付けた小物などは、親ボーンの動きと一緒に動きます。親変更後は位置・向き・大きさを再確認します。',
    limits:
      '読込済みモデルと実在するボーンから選びます。親の有無を無視して座標を比較しないでください。',
    related: [
      'accessory-position',
      'accessory-rotation',
      'camera-parent',
      'bone',
    ],
    sources: ['index.html#L908', 'src/ui/accessory-panel-controller.ts'],
  },
  {
    id: 'accessory-tr',
    group: 'accessory',
    name: 'Tr・透明度の欄',
    aliases: 'transparency alpha opacity 不透明度',
    ui: 'Tr',
    where: '下部のアクセサリー欄',
    meaning:
      '透明度用として配置されている数値欄ですが、v0.2.4では無効状態で作られています。',
    change:
      '通常UIからこの値を変更してアクセサリを透過させる操作は案内できません。表示ON/OFFや素材の透過情報とは区別してください。',
    limits:
      '欄定義は0〜1、step 0.01ですが入力不可。値の大小による透過方向を、実装済みの操作として覚える必要はありません。',
    related: ['material', 'accessory-position'],
    sources: ['src/ui/accessory-panel-controller.ts#L268'],
  },
  {
    id: 'input-commit',
    group: 'input',
    name: 'Enterで確定 / キー登録 / 保存',
    aliases: '数値入力 フォーカス Escape Esc キー 書き込み',
    ui: '数値欄のEnter / Escape、キーフレーム登録、プロジェクト保存',
    where: 'ボーン・Camera・アクセサリの数値欄と各登録ボタン',
    meaning:
      '入力確定は欄の値を反映する操作、キー登録はそのフレームに記録する操作、保存は編集をファイルへ残す操作です。',
    change:
      '対象の数値欄はEnterで確定、Escapeで表示を戻す設計です。未確定のまま別の場所へフォーカスを移すと、入力を戻す処理があります。確定後に登録し、キー点を確認して保存します。',
    limits:
      'この説明はEnter確定ヘルパーを使う数値欄が対象です。スライダーや他のダイアログへ一律に当てはめないでください。',
    note: '予期しない値の変化があれば、そのまま登録を繰り返さず、元の値と別名保存したプロジェクトを残してください。',
    related: ['keyframe', 'input-precision', 'camera-distance'],
    sources: [
      'src/ui/panel-control-helpers.ts#L288',
      'src/bottom-panel.ts#L489',
      'src/ui/accessory-panel-controller.ts#L310',
    ],
    guide: { slug: 'manual', anchor: 'edit', label: 'キー編集の操作' },
  },
  {
    id: 'input-precision',
    group: 'input',
    name: '表示桁・step・入力範囲',
    aliases: '丸め 小数 精度 上限 下限 100 0.1 数値入力異常',
    ui: '各数値入力欄',
    where: 'ボーン・Camera・アクセサリの数値欄',
    meaning:
      '表示桁は見せる小数の桁数、stepは入力の増減刻み、入力範囲は欄が扱う上下限です。どれも、読込済みモーションの全内部値をそのまま表示する保証ではありません。',
    change:
      '値を表示し直す際に丸めたり、上下限へ制限したりする処理があります。表示された値を再確定すると、元の細かい値や範囲外の値と異なる値を適用する可能性があります。',
    limits:
      'ボーン・Cameraの位置欄と、アクセサリ位置欄は範囲が異なります。各カードの数字はv0.2.4タグのUI定義を示し、全OS・入力経路での実機保証ではありません。',
    note: 'Issue #28のEnterによるD変化・範囲や丸めの問題はユーザー報告で、正常仕様や修正済みとは扱っていません。報告環境の再現確認は未実施です。重要な編集は別名保存し、登録前後の値・姿勢と短い再生結果を確認してください。',
    related: [
      'input-commit',
      'camera-distance',
      'camera-target',
      'bone-position',
      'accessory-position',
    ],
    sources: [
      'src/bottom-panel.ts#L539',
      'src/bottom-panel.ts#L815',
      'src/ui/accessory-panel-controller.ts#L476',
    ],
  },
];
