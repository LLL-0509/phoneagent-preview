/* Static GitHub Pages preview. All scenario data stays in this page's memory. */
(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const text = (id, value) => { const target = byId(id); if (target) target.textContent = value; };
  const show = (id, visible) => { const target = byId(id); if (target) target.hidden = !visible; };
  const disable = (id, value = true) => { const target = byId(id); if (target) target.disabled = value; };
  const on = (id, event, handler) => byId(id)?.addEventListener(event, handler);
  const element = (tag, content, className) => {
    const node = document.createElement(tag);
    if (content !== undefined) node.textContent = content;
    if (className) node.className = className;
    return node;
  };
  const list = (id, entries) => {
    const target = byId(id);
    if (target) target.replaceChildren(...entries.map((entry) => element('li', entry)));
  };
  const fields = (id, entries) => {
    const target = byId(id);
    if (!target) return;
    target.replaceChildren(...entries.map(([label, value]) => {
      const row = element('p');
      row.append(element('strong', `${label}：`), document.createTextNode(value));
      return row;
    }));
  };

  function previewBanner(reset) {
    const banner = element('aside', undefined, 'preview-info');
    banner.id = 'preview-info';
    banner.setAttribute('aria-label', '前端演示说明');
    const copy = element('div', undefined, 'preview-copy');
    copy.append(element('strong', '前端演示 · 虚构数据'));
    copy.append(element('p', '不连接 AI / 后台 / 真实电话；输入仅本页显示，刷新清除。请勿填写真实敏感信息。'));
    const nav = element('nav', undefined, 'preview-navigation');
    nav.setAttribute('aria-label', '前端演示导航');
    [['工作台', './index.html'], ['模拟来电', './caller.html']].forEach(([label, href]) => {
      const link = element('a', label);
      link.href = href;
      if ((label === '工作台') === document.body.classList.contains('staff-page')) link.setAttribute('aria-current', 'page');
      nav.append(link);
    });
    const button = element('button', '重置预览');
    button.id = 'preview-reset';
    button.type = 'button';
    button.addEventListener('click', reset);
    nav.append(button);
    banner.append(copy, nav);
    document.body.prepend(banner);
  }

  function disableAudio() {
    [
      'staff-voice-start', 'staff-voice-stop', 'staff-voice-cancel', 'staff-voice-confirm',
      'voice-start', 'voice-stop', 'voice-interrupt', 'speaker-toggle', 'voice-pause',
      'voice-review-send', 'voice-review-discard', 'voice-review-mode', 'voice-continuous',
      'voice-headphone-barge',
    ].forEach((id) => {
      disable(id);
      if (byId(id)) byId(id).title = '前端预览仅展示语音控件，不启用麦克风或播报';
    });
    text('staff-voice-status', '前端预览仅展示语音控件；请使用文字演示。');
    text('microphone-status', '预览禁用');
    text('speaker-status', '预览禁用');
    document.querySelectorAll('.staff-voice-disclosure').forEach((node) => {
      node.textContent = '本预览不采集麦克风、不识别语音、不播放音频。文字仅在当前页面展示。';
    });
    const options = document.querySelector('.voice-options');
    if (options) {
      const explanation = options.querySelector('p');
      if (explanation) explanation.textContent = '本预览只展示语音设置，不采集麦克风、不识别语音、不播放音频。';
      options.querySelectorAll('a').forEach((anchor) => anchor.remove());
    }
  }

  function staffPreview() {
    const originalMessages = [
      { role: 'AI', content: '您好，我是智能语音助手。您可以说明需要什么帮助，也可以请求工作人员接听。' },
      { role: 'USER', content: '我最近任务有点多，想找人聊一聊。' },
      { role: 'USER', content: '可以请工作人员接听吗？' },
      { role: 'SYSTEM', content: '固定演示：来电已进入等待人工场景，智能助手暂停回复。' },
    ];
    let stage = 'WAITING_HUMAN';
    let available = false;
    let messages = [];
    let workOrder = null;
    const labels = { WAITING_HUMAN: '等待人工接管', HUMAN_CONNECTED: '人工接听中', ENDED: '通话已结束' };
    const notice = (value) => {
      const onGate = Boolean(byId('staff-entry') && !byId('staff-entry').hidden);
      text('staff-notice', value);
      show('staff-notice', Boolean(value) && !onGate);
      text('staff-entry-alert', value);
      show('staff-entry-alert', Boolean(value) && onGate);
    };

    function renderMessages() {
      const target = byId('staff-conversation-log');
      target.replaceChildren(...messages.map((message, index) => {
        const classes = { USER: 'user-message', AI: 'assistant-message', STAFF: 'staff-message', SYSTEM: 'system-message' };
        const names = { USER: '演示来电者', AI: '智能语音助手 · 固定文案', STAFF: '工作人员 · 本页输入', SYSTEM: '演示提示' };
        const avatars = { USER: '来', AI: 'AI', STAFF: '工', SYSTEM: '·' };
        const wrapper = element('div', undefined, `message ${classes[message.role]}`);
        const body = element('div', undefined, 'message-body');
        const heading = element('span', names[message.role], 'speaker');
        heading.append(element('small', `演示消息 ${String(index + 1).padStart(2, '0')}`));
        body.append(heading, element('p', message.content));
        wrapper.append(element('span', avatars[message.role], 'avatar'), body);
        return wrapper;
      }));
      target.scrollTop = target.scrollHeight;
      const evidence = byId('copilot-summary-evidence');
      const quotes = messages.filter((message) => ['USER', 'STAFF'].includes(message.role));
      evidence.replaceChildren(...quotes.map((message) => {
        const row = element('li');
        row.append(element('span', message.role === 'USER' ? '演示来电者原话' : '工作人员本页输入', 'summary-evidence-meta'));
        row.append(element('p', `“${message.content}”`));
        return row;
      }));
      text('copilot-summary', '来电者明确表达：“我最近任务有点多，想找人聊一聊。”；并请求：“可以请工作人员接听吗？”');
      text('copilot-summary-note', '固定原话摘录示例；新增工作人员文字只追加引用，不进行模型分析。');
    }

    function renderQueue() {
      const target = byId('queue-list');
      if (stage === 'ENDED') {
        target.replaceChildren(element('p', '演示通话已结束，点击“重置预览”可重新开始。', 'empty-state'));
        return;
      }
      const item = element('article', undefined, 'queue-item selected');
      const header = element('div', undefined, 'queue-item-header');
      header.append(element('span', '优先级 —', 'priority'), element('span', '固定场景', 'queue-wait'));
      item.append(header, element('h3', '000****0000'));
      item.append(element('p', labels[stage], 'queue-call-status'));
      item.append(element('p', '来电者明确请求工作人员接听'));
      item.append(element('small', '虚构来电 · 演示来电者', 'queue-id'));
      const buttons = element('div', undefined, 'queue-item-actions');
      const view = element('button', '查看');
      view.type = 'button';
      view.addEventListener('click', () => {
        byId('current-title').scrollIntoView({ behavior: 'auto', block: 'nearest' });
        notice('正在展示固定虚构来电；工作台和模拟来电页面各自演示，不进行双端通信。');
      });
      buttons.append(view);
      if (stage === 'WAITING_HUMAN') {
        const accept = element('button', '接管', 'queue-accept');
        accept.type = 'button';
        accept.disabled = !available;
        accept.addEventListener('click', acceptScenario);
        buttons.append(accept);
      }
      item.append(buttons);
      target.replaceChildren(item);
    }

    function renderControls() {
      const connected = stage === 'HUMAN_CONNECTED';
      const waiting = stage === 'WAITING_HUMAN';
      const signedIn = available || connected;
      const identity = byId('staff-identity');
      const card = byId('staff-entry-card');
      const dock = byId('staff-identity-dock');
      const note = byId('staff-entry-note');
      const host = signedIn ? dock : card;
      if (identity && host && identity.parentElement !== host) {
        if (!signedIn && note) card.insertBefore(identity, note);
        else host.append(identity);
      }
      show('staff-entry', !signedIn);
      show('staff-workspace', signedIn);
      if (byId('staff-workspace')) byId('staff-workspace').style.display = signedIn ? '' : 'none';
      text('staff-status', connected ? 'BUSY' : available ? 'AVAILABLE' : 'OFFLINE');
      text('socket-status', '本页演示 · 无后台连接');
      text('staff-call-state', `${labels[stage]} · 演示`);
      text('staff-handoff', stage);
      text('copilot-status', stage === 'ENDED' ? '记录示例' : connected ? '引用展示' : '交接预览');
      disable('staff-id', connected);
      disable('online', available || connected);
      disable('offline', !available || connected);
      disable('accept-session', !waiting || !available);
      disable('reject-session', !waiting || !available);
      disable('reject-reason', !waiting);
      disable('staff-message', !connected);
      disable('staff-send', !connected);
      show('end-service-block', connected);
      text('staff-composer-note', connected ? '文字仅追加到本页演示，不发送给其他页面或后台。' : '接受演示接管后，可在本页追加工作人员文字。');
      renderQueue();
    }

    function acceptScenario() {
      if (stage !== 'WAITING_HUMAN' || !available) return;
      stage = 'HUMAN_CONNECTED';
      messages.push({ role: 'SYSTEM', content: '固定演示：工作人员已接受接管。可输入示例文字；没有真实通话或消息发送。' });
      renderMessages();
      renderControls();
      notice('已进入人工接听展示。尝试输入一条示例文字，再展开“结束服务与跟进”查看工单示例。');
    }

    function renderWorkOrder() {
      show('work-order-block', Boolean(workOrder));
      show('final-record-block', Boolean(workOrder));
      show('follow-up-block', Boolean(workOrder?.followUp));
      if (!workOrder) {
        text('work-order-history-status', '结束演示服务后显示一份待审工单示例。');
        byId('work-order-history-list').replaceChildren();
        return;
      }
      text('work-order-status', 'REVIEW_REQUIRED · 示例');
      text('work-order-note', '虚构待审工单；仅本页展示，未保存或投递，刷新即清除。');
      const details = [
        ['工单编号', 'PREVIEW-001'], ['审核状态', '待工作人员审核（虚构示例）'],
        ['来电者原话', originalMessages[1].content], ['工作人员备注', workOrder.notes || '未填写'],
        ['工作人员演示文字', workOrder.replies || '未输入'], ['后续跟进', workOrder.followUp ? '勾选了跟进示例' : '未勾选'],
      ];
      fields('work-order-record', details);
      fields('final-record', details);
      fields('follow-up-record', [['跟进原因', workOrder.reason || '未填写'], ['建议时间', workOrder.time || '未填写'], ['说明', '仅为前端示例，没有创建真实任务。']]);
      text('work-order-history-status', '当前页面有 1 份虚构待审工单，刷新后清除。');
      const row = element('article', undefined, 'work-order-history-item');
      row.append(element('strong', 'PREVIEW-001 · 演示通话记录'), element('small', 'REVIEW_REQUIRED · 仅本页显示'));
      const view = element('button', '查看示例');
      view.type = 'button';
      view.addEventListener('click', () => byId('work-order-block').scrollIntoView({ behavior: 'auto', block: 'center' }));
      row.append(view);
      byId('work-order-history-list').replaceChildren(row);
    }

    function reset() {
      stage = 'WAITING_HUMAN';
      available = false;
      messages = originalMessages.map((message) => ({ ...message }));
      workOrder = null;
      ['staff-chat-form', 'end-service-form', 'staff-knowledge-form'].forEach((id) => byId(id)?.reset());
      byId('staff-id').value = 'staff001';
      byId('reject-reason').value = '';
      byId('end-service-block').open = false;
      show('follow-up-fields', false);
      byId('follow-up-reason').required = false;
      byId('staff-knowledge-results').replaceChildren();
      text('staff-knowledge-status', '本预览不连接知识库；输入查询词可查看检索区域的固定说明。');
      renderMessages();
      renderControls();
      renderWorkOrder();
      notice('请先点击“上线”进入前端演示；刷新或重置后会退出。');
    }

    previewBanner(reset);
    const entryDescription = byId('staff-entry-card')?.querySelector('h2 + p');
    if (entryDescription) entryDescription.textContent = '选择演示坐席后点击上线。仅在当前页面展示，不创建账号或保存登录凭据。';
    document.querySelector('.brand').href = './index.html';
    const navigation = document.querySelectorAll('.staff-navigation a');
    if (navigation[0]) navigation[0].href = './index.html';
    if (navigation[1]) { navigation[1].href = './caller.html'; navigation[1].removeAttribute('target'); }
    text('current-title', '演示来电者 · 000****0000');
    text('current-session', '虚构会话 PREVIEW-001');
    show('staff-call-header', true);
    text('staff-call-started', '来电时间 · 固定演示');
    text('staff-call-duration', '时长 · 固定场景');
    text('main-request', '“我最近任务有点多，想找人聊一聊。”');
    text('copilot-updated', '固定示例');
    text('staff-handoff-reasons', '演示来电者明确请求工作人员接听。');
    fields('staff-collected', [['明确需求', originalMessages[1].content], ['人工请求', originalMessages[2].content]]);
    fields('staff-package-content', [['说明', '固定交接资料示例，非后台生成。'], ['明确需求', originalMessages[1].content], ['接管原因', originalMessages[2].content]]);
    text('staff-intent', '固定示例');
    text('staff-skill', '未调用');
    text('staff-trace-status', '未执行');
    text('staff-trace-id', '本预览未运行 Agent，不生成 Trace。');
    text('handoff-metrics', '本预览不记录实际处理耗时。');
    list('staff-risk-prompts', ['此固定示例不生成风险等级或诊断结论；所有原话仅用于展示，需由专业工作人员核实。']);
    list('staff-sources', ['前端资料区域示例；未执行知识检索，也未向来电者提供服务承诺。']);
    list('staff-knowledge-datasets', ['本预览未查询、下载或使用任何咨询对话数据集。']);
    list('next-actions', ['查看固定来电原话与人工请求。', '点击“接受接管”体验工作人员文字区域。', '结束演示服务，查看虚构待审工单。']);
    document.querySelector('.copilot-boundary').textContent = '本栏展示固定原话和页面输入，不连接模型；专业判断由工作人员作出。';
    document.querySelector('.queue-panel .history-note').textContent = '固定虚构来电用于展示工作台流程；本预览不连接真实队列或其他页面。';
    document.querySelector('.panel-footnote').textContent = '前端演示仅显示虚构来电、原话摘录和工单示例。不连接 AI、后台、真实机构或电话；不提供诊断或治疗。请勿输入真实敏感信息。';
    on('accept-session', 'click', acceptScenario);
    on('reject-session', 'click', () => notice('本预览只展示固定接管场景，不执行真实队列操作。可点击“接受接管”继续体验。'));
    on('online', 'click', () => { available = true; renderControls(); notice('已切换为可接管展示；未连接真实坐席系统。'); });
    on('offline', 'click', () => { available = false; renderControls(); notice('已切换为离线展示；点击“上线”可继续体验。'); });
    on('staff-id', 'change', () => notice('已切换展示身份；本预览没有登录或真实工作人员权限。'));
    on('refresh-queue', 'click', () => { renderQueue(); notice('已重新展示固定演示队列，没有请求后台。'); });
    on('refresh-work-orders', 'click', renderWorkOrder);
    on('staff-chat-form', 'submit', (event) => {
      event.preventDefault();
      if (stage !== 'HUMAN_CONNECTED') return;
      const value = byId('staff-message').value.trim();
      if (!value) return;
      messages.push({ role: 'STAFF', content: value });
      byId('staff-message').value = '';
      renderMessages();
      notice('示例文字已追加到当前页面；没有向来电者、其他页面或后台发送。');
    });
    on('follow-up-required', 'change', () => {
      const checked = byId('follow-up-required').checked;
      show('follow-up-fields', checked);
      byId('follow-up-reason').required = checked;
    });
    on('end-service-form', 'submit', (event) => {
      event.preventDefault();
      if (stage !== 'HUMAN_CONNECTED') return;
      workOrder = {
        notes: byId('staff-notes').value.trim(),
        replies: messages.filter((message) => message.role === 'STAFF').map((message) => message.content).join('\n'),
        followUp: byId('follow-up-required').checked,
        reason: byId('follow-up-reason').value.trim(), time: byId('suggested-time').value,
      };
      stage = 'ENDED';
      messages.push({ role: 'SYSTEM', content: '固定演示：服务已结束，显示一份虚构待审工单。没有保存记录或建立真实跟进任务。' });
      renderMessages();
      renderControls();
      renderWorkOrder();
      notice('演示服务已结束。右侧显示虚构待审工单；所有输入刷新后清除。');
    });
    on('staff-knowledge-form', 'submit', (event) => {
      event.preventDefault();
      const query = byId('staff-knowledge-query').value.trim();
      if (!query) return;
      text('staff-knowledge-status', `检索区域演示：“${query}” · 未查询真实知识库。`);
      list('staff-knowledge-results', [
        '固定说明：真实项目的工作人员检索会显示资料出处与审核状态。',
        '此预览未调用知识工具，不提供检索结果、事实回答或真实机构服务信息。',
      ]);
    });
    disableAudio();
    reset();
  }

  function callerPreview() {
    let stage = 'SETUP';
    const accept = element('button', '模拟人工接入');
    accept.id = 'preview-human-connect';
    accept.type = 'button';
    accept.hidden = true;
    byId('request-staff').after(accept);
    text('simulate-call', '开始模拟来电');
    byId('caller-number').value = '00000000000';
    byId('caller-name').value = '演示来电者';
    byId('call-setup').querySelector('p:not(.eyebrow)').textContent = '这是固定来电流程的前端演示。不会拨号、连接 AI 或后台，请使用虚构号码和称呼。';
    document.querySelector('.caller-shell > footer').textContent = '前端演示不采集麦克风、不识别或合成语音、不保存输入。智能助手身份提示为固定文案，页面不提供诊断或治疗。';
    show('development-tools', false);
    show('voice-review', false);

    function render() {
      show('call-setup', stage === 'SETUP');
      show('call-screen', stage !== 'SETUP');
      show('new-call', stage === 'ENDED');
      show('preview-human-connect', stage === 'WAITING_HUMAN');
      show('human-note', stage === 'HUMAN_CONNECTED');
      disable('request-staff', stage !== 'AI_ACTIVE');
      disable('hangup-call', ['SETUP', 'ENDED'].includes(stage));
      text('call-duration', '00:00');
      text('human-note', '固定演示：工作人员已接入展示。没有真实工作人员、双端通信或音频通话。');
      const fixed = {
        AI_ACTIVE: ['智能助手接待 · 前端演示', '智能语音助手 · 固定身份提示', '“您好，我是智能语音助手。” 本页只展示固定文案，不连接 AI。可点击“转接工作人员”查看等待页面。'],
        WAITING_HUMAN: ['等待人工接管 · 前端演示', '固定等待场景', '“正在为您转接工作人员，请稍候。” 此为固定演示提示，期间不进行 AI 咨询。点击“模拟人工接入”继续。'],
        HUMAN_CONNECTED: ['人工接听中 · 前端演示', '演示工作人员', '已进入人工接听的页面展示，可点击“挂断”查看结束状态。'],
        ENDED: ['通话已结束 · 前端演示', '本页模拟结束', '演示已结束，没有拨打真实电话或保存通话。可模拟新的来电。'],
      };
      if (fixed[stage]) {
        text('call-status', fixed[stage][0]);
        text('call-party', fixed[stage][1]);
        text('call-notice', fixed[stage][2]);
      }
    }
    function reset() {
      stage = 'SETUP';
      byId('incoming-form').reset();
      byId('caller-number').value = '00000000000';
      byId('caller-name').value = '演示来电者';
      render();
    }
    previewBanner(reset);
    on('incoming-form', 'submit', (event) => { event.preventDefault(); stage = 'AI_ACTIVE'; render(); });
    on('request-staff', 'click', () => { if (stage === 'AI_ACTIVE') { stage = 'WAITING_HUMAN'; render(); } });
    accept.addEventListener('click', () => { if (stage === 'WAITING_HUMAN') { stage = 'HUMAN_CONNECTED'; render(); } });
    on('hangup-call', 'click', () => { if (!['SETUP', 'ENDED'].includes(stage)) { stage = 'ENDED'; render(); } });
    on('new-call', 'click', reset);
    disableAudio();
    reset();
  }

  if (document.body.classList.contains('staff-page')) staffPreview();
  else if (byId('incoming-form')) callerPreview();
})();
