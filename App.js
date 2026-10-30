import React, { Component, useState, useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Paywall from './src/components/Paywall';
import { canUseApp, markPro, readEntitlement, TRIAL_DAYS } from './src/lib/entitlement';

const modules = [
  {
    id: 'market',
    title: '大盘环境',
    icon: '📊',
    desc: '今天能不能做',
    questions: [
      { id: 'q1', text: '今天大盘指数是涨还是跌？', options: [{ text: '上涨', next: 'q2' }, { text: '下跌', next: 'q3' }, { text: '基本持平', next: 'q3' }], hint: '看上证指数、深证成指或创业板指的整体方向。' },
      { id: 'q2', text: '上涨/下跌幅度超过 1% 吗？', options: [{ text: '是，涨/跌很猛', next: 'q4' }, { text: '没有，窄幅波动', next: 'q5' }], hint: '涨幅超过 1% 说明情绪较强，低于 0.5% 属于震荡。' },
      { id: 'q3', text: '今日涨跌家数比如何？', options: [{ text: '涨多跌少', next: 'r1' }, { text: '跌多涨少', next: 'r2' }, { text: '基本持平', next: 'r5' }], hint: '涨跌家数比反映市场整体赚钱效应。' },
      { id: 'q4', text: '你关注的主线板块今天表现如何？', options: [{ text: '领涨市场', next: 'r1' }, { text: '表现一般', next: 'r5' }, { text: '在下跌', next: 'r2' }] },
      { id: 'q5', text: '市场成交量相比昨日如何？', options: [{ text: '放量', next: 'r1' }, { text: '缩量', next: 'r3' }], hint: '放量上涨更可靠，缩量上涨容易冲高回落。' }
    ],
    results: {
      r1: { status: 'ok', icon: '✅', title: '适合操作', summary: '市场氛围较好，主线清晰，可以积极参与。', actions: ['优先参与主线板块龙头', '仓位可提升至 50%-70%', '避免去弱势板块抄底'], risk: '即使氛围好，也不要满仓单押一只。' },
      r2: { status: 'no', icon: '🛑', title: '建议空仓/减仓', summary: '市场整体走弱，亏钱效应明显，管住手更重要。', actions: ['空仓观望，或仓位降至 20% 以下', '不要逆势抄底', '只保留最强龙头底仓'], risk: '弱势行情下，任何买入都要格外谨慎。' },
      r3: { status: 'warn', icon: '⚠️', title: '谨慎参与', summary: '市场方向不明，缩量震荡，适合小仓位试错。', actions: ['仓位控制在 30% 以内', '只买辨识度最高的龙头', '快进快出，不恋战'], risk: '缩量行情容易突然变盘。' },
      r5: { status: 'warn', icon: '⏸️', title: '先观望', summary: '市场没有明确方向，多看少动。', actions: ['持仓不动', '不新开仓', '等市场选择方向'], risk: '震荡市最容易反复打脸。' }
    }
  },
  {
    id: 'stockpick',
    title: '选股',
    icon: '🔍',
    desc: '买什么',
    questions: [
      { id: 'q1', text: '你更想参与哪种机会？', options: [{ text: '热点主线', next: 'q2' }, { text: '超跌反弹', next: 'r3' }, { text: '趋势白马', next: 'r4' }, { text: '我不知道', next: 'q2' }] },
      { id: 'q2', text: '你知道最近的市场主线是什么吗？', options: [{ text: '知道', next: 'q3' }, { text: '不知道', next: 'r5' }], hint: '主线通常是近期连续上涨、有政策或消息催化的板块。' },
      { id: 'q3', text: '该板块今天处于什么状态？', options: [{ text: '板块涨幅前三', next: 'q4' }, { text: '板块分歧震荡', next: 'r2' }, { text: '板块在下跌', next: 'r1' }] },
      { id: 'q4', text: '你看中的股票在板块内是什么位置？', options: [{ text: '涨停或最早涨停', next: 'r6' }, { text: '涨幅前列但没涨停', next: 'r7' }, { text: '中后排跟涨', next: 'r1' }, { text: '我不知道', next: 'r8' }] }
    ],
    results: {
      r1: { status: 'no', icon: '❌', title: '不建议买', summary: '板块弱势或个股处于中后排，买入容易被套。', actions: ['放弃这笔买入', '等板块转强再看', '只考虑板块龙头'], risk: '弱势股反弹往往很弱。' },
      r2: { status: 'warn', icon: '⚠️', title: '只买龙头', summary: '板块出现分歧，只有核心龙头才值得参与。', actions: ['只买板块内最强 1-2 只', '仓位要轻', '设置严格止损'], risk: '分歧日跟风股最容易大跌。' },
      r3: { status: 'warn', icon: '⏳', title: '超跌反弹需谨慎', summary: '超跌反弹对时机要求很高，新手不建议轻易参与。', actions: ['等出现止跌阳线', '仓位不超过 20%', '快进快出'], risk: '下跌途中抄底容易接飞刀。' },
      r4: { status: 'ok', icon: '📈', title: '趋势白马可配置', summary: '趋势白马适合中长线持有，但短期波动也要接受。', actions: ['分批买入', '持有周期放长', '不追涨，等回调'], risk: '趋势股也会回调，不要追高。' },
      r5: { status: 'warn', icon: '📚', title: '先了解主线', summary: '你还不知道主线是什么，建议先观察市场热点。', actions: ['查看今日涨幅榜前 10 的板块', '找出连续 2-3 天活跃的板块', '再回来看选股'], risk: '盲目选股等于赌博。' },
      r6: { status: 'ok', icon: '👑', title: '买龙头', summary: '板块强势，该股是龙头，值得重点关注。', actions: ['次日竞价观察是否高开', '若开的不高可小仓位参与', '设置止损位'], risk: '龙头也可能高开低走，注意仓位。' },
      r7: { status: 'warn', icon: '🔸', title: '可考虑补涨', summary: '该股表现不错，但不是最强龙头，属于补涨机会。', actions: ['仓位要比龙头更轻', '次日不能转强就放弃', '不追涨，等回踩'], risk: '补涨股一旦龙头倒下，跌得更快。' },
      r8: { status: 'warn', icon: '🔍', title: '先确认个股地位', summary: '你还不知道这只股在板块内的位置，建议先查清楚。', actions: ['看板块内个股涨幅排名', '找出最早涨停、封单最大的', '优先参与最强的'], risk: '不知道地位就买入，容易买到跟风股。' }
    }
  },
  {
    id: 'buy',
    title: '买点',
    icon: '💰',
    desc: '什么时候买',
    questions: [
      { id: 'q1', text: '这只股票目前处于什么阶段？', options: [{ text: '启动初期', next: 'q2' }, { text: '已经涨了一段', next: 'q3' }, { text: '高位震荡', next: 'r1' }, { text: '下跌中', next: 'r2' }] },
      { id: 'q2', text: '今天是首次放量上涨吗？', options: [{ text: '是，首次放量突破', next: 'r3' }, { text: '不是，已经连涨几天', next: 'q3' }] },
      { id: 'q3', text: '你打算什么时候买入？', options: [{ text: '开盘直接追', next: 'r4' }, { text: '盘中回踩时', next: 'r5' }, { text: '尾盘', next: 'r6' }] }
    ],
    results: {
      r1: { status: 'warn', icon: '⏸️', title: '高位震荡，等方向', summary: '高位震荡说明多空分歧大，不是好的买入时机。', actions: ['等突破新高再考虑', '或等回踩重要均线', '不要急着冲进去'], risk: '高位震荡后向下破位很常见。' },
      r2: { status: 'no', icon: '🛑', title: '下跌中别买', summary: '下跌途中的买入大多是接飞刀，新手尤其要避开。', actions: ['等止跌信号出现', '等放量阳线', '或换一只强势票'], risk: '你以为的底，可能下面还有底。' },
      r3: { status: 'ok', icon: '✅', title: '启动买点', summary: '启动初期首次放量突破，是较好的试错买点。', actions: ['次日回踩可买入', '仓位控制在 30%-50%', '跌破启动阳线低点止损'], risk: '启动失败也要果断止损。' },
      r4: { status: 'warn', icon: '⚠️', title: '开盘追高有风险', summary: '开盘直接追容易被短暂冲高套住。', actions: ['观察 5-15 分钟走势', '确认承接有力再下单', '仓位减半'], risk: '开盘冲高后回落是常态。' },
      r5: { status: 'ok', icon: '✅', title: '回踩买点', summary: '盘中回踩是较稳妥的买入方式。', actions: ['回踩到分时均线或昨日收盘价附近', '放量反弹时买入', '跌破分时低点放弃'], risk: '回踩变下跌时要及时撤单。' },
      r6: { status: 'warn', icon: '🌙', title: '尾盘谨慎买', summary: '尾盘买入适合确认当天能稳住，但次日不确定性大。', actions: ['只在板块尾盘仍强势时买', '仓位要轻', '次日不及预期就离场'], risk: '尾盘拉升可能是诱多。' }
    }
  },
  {
    id: 'position',
    title: '仓位',
    icon: '⚖️',
    desc: '买多少',
    questions: [
      { id: 'q1', text: '今天是你的第几笔买入？', options: [{ text: '第一笔建仓', next: 'q2' }, { text: '加仓', next: 'q4' }, { text: '已经满仓', next: 'r1' }] },
      { id: 'q2', text: '当前大盘环境如何？', options: [{ text: '好', next: 'q3' }, { text: '一般', next: 'r4' }, { text: '差', next: 'r5' }] },
      { id: 'q3', text: '你对这笔交易的把握有多大？', options: [{ text: '很大', next: 'r2' }, { text: '一般', next: 'r4' }, { text: '试试水', next: 'r5' }] },
      { id: 'q4', text: '第一笔买入目前是盈利还是亏损？', options: [{ text: '盈利', next: 'r6' }, { text: '亏损', next: 'r7' }] }
    ],
    results: {
      r1: { status: 'no', icon: '🚫', title: '已经满仓，不能买了', summary: '满仓意味着没有回旋余地，一只票下跌就会非常被动。', actions: ['停止买入', '等卖出释放仓位', '以后单票不超过总资金 30%'], risk: '满仓是新手大亏的主要原因。' },
      r2: { status: 'ok', icon: '💪', title: '可重仓 50%-70%', summary: '环境好、把握大，可以大胆一些，但仍要留有余地。', actions: ['单票最多 50%', '保留 30% 现金应对波动', '设置止损'], risk: '再看好也不要一把梭。' },
      r4: { status: 'warn', icon: '⚖️', title: '半仓 30%-50%', summary: '环境一般或把握一般，小仓位参与即可。', actions: ['单票不超过 30%', '先买一半，确认强势再加', '保留机动资金'], risk: '仓位过重容易被波动洗出去。' },
      r5: { status: 'warn', icon: '🪶', title: '轻仓 10%-20%', summary: '环境差或没把握，最多用一两成资金试水。', actions: ['单票 10%-20%', '错了也要认', '不要补仓摊低成本'], risk: '弱市重仓是快速亏钱的路径。' },
      r6: { status: 'ok', icon: '➕', title: '可加仓', summary: '第一笔已经盈利，说明判断正确，可加仓。', actions: ['加仓不超过原仓位的一半', '总仓位仍要控制', '跌破成本价停止加仓'], risk: '加仓后成本提高，容错空间变小。' },
      r7: { status: 'no', icon: '🛑', title: '亏损不加仓', summary: '亏损说明判断可能错了，加仓只会扩大风险。', actions: ['停止加仓', '审视是否止损', '不要摊低成本'], risk: '越跌越买是很多新手大亏的根源。' }
    }
  },
  {
    id: 'ttrade',
    title: '做T',
    icon: '🔄',
    desc: '降低成本',
    questions: [
      { id: 'q1', text: '你目前这只股票是盈利还是亏损？', options: [{ text: '盈利', next: 'q2' }, { text: '亏损', next: 'q2' }, { text: '持平', next: 'q2' }] },
      { id: 'q2', text: '今日开盘走势如何？', options: [{ text: '高开', next: 'q3' }, { text: '低开', next: 'q4' }, { text: '平开', next: 'q5' }] },
      { id: 'q3', text: '高开后盘中有没有冲高？', options: [{ text: '冲高后回落', next: 'r1' }, { text: '高开高走', next: 'r2' }] },
      { id: 'q4', text: '低开后有没有下探反弹？', options: [{ text: '下探后反弹', next: 'r3' }, { text: '低开低走', next: 'r4' }] },
      { id: 'q5', text: '盘中整体是震荡还是单边？', options: [{ text: '震荡', next: 'r5' }, { text: '单边上涨', next: 'r2' }, { text: '单边下跌', next: 'r4' }] }
    ],
    results: {
      r1: { status: 'ok', icon: '📉➡️📈', title: '高抛后低吸', summary: '高开冲高后回落，适合做T降低成本。', actions: ['冲高时卖出部分仓位', '回落到均线附近买回', 'T 出部分利润'], risk: '卖飞风险，不要全部卖出。' },
      r2: { status: 'warn', icon: '🚀', title: '持股不动', summary: '单边上涨行情，做T容易卖飞。', actions: ['拿住底仓', '不要频繁操作', '让利润奔跑'], risk: '牛市做T是最大的踏空风险。' },
      r3: { status: 'ok', icon: '📈➡️📉', title: '低吸后高抛', summary: '低开后下探反弹，可以先低吸后高抛。', actions: ['下探到支撑位买入', '反弹到分时高点卖出', '必须当天回转'], risk: '低吸变加仓，跌破支撑要止损。' },
      r4: { status: 'no', icon: '🛑', title: '不要做T，减仓', summary: '单边下跌行情，做T只会越套越深。', actions: ['先减仓避险', '等止跌再说', '不要逆势操作'], risk: '下跌趋势中没有最低，只有更低。' },
      r5: { status: 'ok', icon: '〰️', title: '震荡做T', summary: '震荡行情是做T的最佳时机。', actions: ['设定箱体上下沿', '靠近上沿卖，靠近下沿买', '严格按计划执行'], risk: '箱体破位要及时停止做T。' }
    }
  },
  {
    id: 'sell',
    title: '卖点',
    icon: '💸',
    desc: '什么时候卖',
    questions: [
      { id: 'q1', text: '你目前这只股票盈亏状态？', options: [{ text: '盈利', next: 'q2' }, { text: '亏损', next: 'q5' }] },
      { id: 'q2', text: '盈利比例大概是多少？', options: [{ text: '小于 5%', next: 'q3' }, { text: '5%-10%', next: 'q3' }, { text: '超过 10%', next: 'q4' }] },
      { id: 'q3', text: '今日走势如何？', options: [{ text: '继续大涨', next: 'r1' }, { text: '冲高回落', next: 'r2' }, { text: '横盘震荡', next: 'r3' }] },
      { id: 'q4', text: '板块今天还在走强吗？', options: [{ text: '是', next: 'r4' }, { text: '否，开始分化', next: 'r2' }, { text: '板块大跌', next: 'r5' }] },
      { id: 'q5', text: '亏损幅度是多少？', options: [{ text: '小于 5%', next: 'q6' }, { text: '5%-10%', next: 'r6' }, { text: '超过 10%', next: 'r7' }] },
      { id: 'q6', text: '你买入的逻辑还在吗？', options: [{ text: '还在', next: 'r8' }, { text: '已经不在了', next: 'r6' }] }
    ],
    results: {
      r1: { status: 'ok', icon: '📈', title: '继续持有', summary: '走势强劲，让利润奔跑。', actions: ['设置移动止盈', '不破 5 日线或分时均线不卖', '板块强就拿着'], risk: '贪心可能导致利润回吐。' },
      r2: { status: 'warn', icon: '⚠️', title: '减仓或止盈', summary: '冲高回落说明抛压加重，利润可能回吐。', actions: ['卖出一半锁定利润', '剩余仓位设保本止盈', '板块走弱就清仓'], risk: '不及时止盈，盈利可能变亏损。' },
      r3: { status: 'warn', icon: '⏳', title: '观察一天', summary: '横盘震荡没有明确方向，先观察。', actions: ['设置止损位', '次日不能走强就离场', '不要加仓'], risk: '横盘后可能选择方向向下。' },
      r4: { status: 'ok', icon: '👑', title: '龙头继续持有', summary: '板块仍强，你是龙头，可以多拿。', actions: ['用利润去抗波动', '龙头不倒我不倒', '放量滞涨再考虑卖'], risk: '龙头切换时要及时撤离。' },
      r5: { status: 'no', icon: '🚨', title: '清仓', summary: '板块大跌，个股难有独立行情。', actions: ['立即清仓', '不要幻想反弹', '保住本金最重要'], risk: '犹豫只会亏更多。' },
      r6: { status: 'no', icon: '✂️', title: '止损卖出', summary: '亏损已超预期或逻辑失效，必须止损。', actions: ['果断卖出', '不要补仓摊薄', '总结错误'], risk: '不止损是小亏变大亏的开始。' },
      r7: { status: 'no', icon: '🛑', title: '立即止损', summary: '亏损超过 10%，风险已经失控。', actions: ['无条件减仓或清仓', '先活下来再谈回本', '重新评估选股逻辑'], risk: '扛单可能让亏损扩大到无法承受。' },
      r8: { status: 'warn', icon: '⏸️', title: '再给一天机会', summary: '小亏但逻辑还在，可以再观察。', actions: ['设置止损位', '次日不能反弹就走', '严格控制风险'], risk: '观察不是死扛，破位必须走。' }
    }
  },
  {
    id: 'mentality',
    title: '持股心态',
    icon: '🧠',
    desc: '慌了怎么办',
    questions: [
      { id: 'q1', text: '你现在是什么感觉？', options: [{ text: '很兴奋想追高', next: 'q2' }, { text: '很慌想割肉', next: 'q3' }, { text: '纠结', next: 'q4' }, { text: '平静', next: 'r1' }] },
      { id: 'q2', text: '兴奋是因为股票涨了还是看到别人说某票好？', options: [{ text: '自己持仓涨了', next: 'r2' }, { text: '看到别人推荐/涨停', next: 'r3' }] },
      { id: 'q3', text: '慌是因为跌了多少？', options: [{ text: '小跌 1-3%', next: 'r4' }, { text: '大跌超过 5%', next: 'r5' }] },
      { id: 'q4', text: '纠结是因为想卖还是想买？', options: [{ text: '想卖但舍不得', next: 'r6' }, { text: '想买但怕追高', next: 'r7' }] }
    ],
    results: {
      r1: { status: 'ok', icon: '🧘', title: '心态很好，按计划执行', summary: '情绪稳定是炒股最大的优势。', actions: ['按自己的交易计划操作', '不要被市场噪音干扰', '继续保持'], risk: '平静不等于麻木，计划错了也要调整。' },
      r2: { status: 'warn', icon: '🎯', title: '兴奋是盈利的敌人', summary: '持仓涨了让人兴奋，但兴奋时最容易做错决定。', actions: ['检查是否到了止盈位', '不要因兴奋而加仓', '让利润奔跑但要设止盈'], risk: '兴奋追高，容易买在短期高点。' },
      r3: { status: 'no', icon: '🛑', title: '不要追别人的票', summary: '看到别人赚钱就冲动买入，大多是接盘。', actions: ['关闭群聊/论坛', '回到选股流程重新判断', '没计划就不买'], risk: 'FOMO（害怕错过）是新手大亏主因。' },
      r4: { status: 'warn', icon: '🌊', title: '小波动不要慌', summary: '1-3% 的波动很正常，不要因此乱了节奏。', actions: ['检查买入逻辑是否还在', '设置止损位', '该干嘛干嘛'], risk: '小波动频繁操作会磨损本金。' },
      r5: { status: 'no', icon: '🚨', title: '先暂停 30 分钟', summary: '大跌时情绪主导决策， 90% 会做错。', actions: ['离开屏幕 30 分钟', '回到卖点流程理性判断', '不要一键清仓'], risk: '恐慌性割肉，容易割在最低点。' },
      r6: { status: 'warn', icon: '⚖️', title: '用规则替代情绪', summary: '舍不得卖是因为沉没成本，但炒股要看未来。', actions: ['重新评估卖点流程', '如果逻辑不在了，分批卖', '设置条件单自动执行'], risk: '舍不得卖会让小亏变大亏。' },
      r7: { status: 'warn', icon: '⏸️', title: '怕高就等回踩', summary: '想买又怕追高，说明这笔交易没把握。', actions: ['等回踩再考虑', '或把想买的价位设条件单', '不追就放弃'], risk: '没把握硬上容易买套。' }
    }
  },
  {
    id: 'review',
    title: '每日复盘',
    icon: '📝',
    desc: '今天学到了',
    questions: [
      { id: 'q1', text: '今天操作了吗？', options: [{ text: '买了', next: 'q2' }, { text: '卖了', next: 'q2' }, { text: '持仓没动', next: 'r1' }, { text: '空仓', next: 'r2' }] },
      { id: 'q2', text: '结果如何？', options: [{ text: '赚了', next: 'q3' }, { text: '亏了', next: 'q4' }, { text: '持平', next: 'r3' }] },
      { id: 'q3', text: '这笔盈利是计划内还是意外？', options: [{ text: '计划内', next: 'r4' }, { text: '靠运气', next: 'r5' }] },
      { id: 'q4', text: '亏损原因是什么？', options: [{ text: '追涨杀跌', next: 'r6' }, { text: '没止损', next: 'r7' }, { text: '仓位太重', next: 'r8' }, { text: '判断错了', next: 'r9' }] }
    ],
    results: {
      r1: { status: 'ok', icon: '🛡️', title: '持股观望也是操作', summary: '今天没有乱动，避免了不必要的手续费和冲动错误。', actions: ['记录持仓逻辑', '明天继续按计划执行', '不被盘面诱惑'], risk: '观望不等于忽视，破位仍要执行纪律。' },
      r2: { status: 'ok', icon: '☕', title: '空仓是高级操作', summary: '能在不确定时空仓，说明你有风险意识。', actions: ['总结今天为什么没出手', '关注明天可能出现的机会', '保持耐心'], risk: '空仓太久也可能错过行情，保持观察。' },
      r3: { status: 'warn', icon: '😐', title: '持平复盘', summary: '不赚不亏，但付出了时间和精力。', actions: ['检查交易成本占比', '评估是否值得参与', '优化买卖点'], risk: '频繁持平交易会被手续费磨损。' },
      r4: { status: 'ok', icon: '✅', title: '计划内盈利，继续执行', summary: '按规则赚钱是最健康的盈利模式。', actions: ['把这笔交易记录下来', '总结成功要素', '重复正确的事'], risk: '不要因为一次成功就放大仓位。' },
      r5: { status: 'warn', icon: '🍀', title: '靠运气赚的钱，别膨胀', summary: '运气赚的钱，长期看都会靠实力亏回去。', actions: ['回看这笔交易的买入理由', '找出运气的部分', '下次按流程执行'], risk: '把运气当实力，下次会亏更多。' },
      r6: { status: 'no', icon: '📉', title: '克服追涨杀跌', summary: '追涨杀跌是新手最常见亏损模式。', actions: ['买点/卖点流程再走一遍', '设置条件单减少临时决策', '只做计划内交易'], risk: '情绪交易不改正，本金很难保住。' },
      r7: { status: 'no', icon: '✂️', title: '必须建立止损纪律', summary: '不止损是小亏变大亏的核心原因。', actions: ['买入前先定好止损位', '设置条件单自动止损', '接受亏损是交易的一部分'], risk: '没有止损规则，迟早会深套。' },
      r8: { status: 'no', icon: '⚖️', title: '仓位管理要优先', summary: '仓位太重会让一次错误伤筋动骨。', actions: ['以后单票不超过 30%', '分仓配置', '先小仓位验证逻辑'], risk: '重仓一旦错，回本很难。' },
      r9: { status: 'warn', icon: '🔍', title: '提升判断能力', summary: '判断错了是正常的，但要从中学习。', actions: ['记录当时的判断依据', '对比实际走势找偏差', '回测选股/卖点流程'], risk: '同样的错误重复犯，就是白亏。' }
    }
  }
];

const COLORS = {
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  bg: '#f5f7fa',
  surface: '#ffffff',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
};

export default function App() {
  return (
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  );
}

class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorWrap}>
            <Text style={styles.errorTitle}>出了点问题</Text>
            <Text style={styles.errorText}>{String(this.state.error?.message ?? this.state.error)}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => this.setState({ error: null })}>
              <Text style={styles.primaryBtnText}>重试</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

function Root() {
  const [screen, setScreen] = useState('home');
  const [currentModule, setCurrentModule] = useState(null);
  const [questionId, setQuestionId] = useState(null);
  const [history, setHistory] = useState([]);
  const [entitlement, setEntitlement] = useState(null);
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    readEntitlement()
      .then(setEntitlement)
      .catch(() => setEntitlement({ isPro: false, trialDaysLeft: TRIAL_DAYS, trialExpired: false }));
  }, []);

  const handlePurchased = useCallback(() => {
    markPro().then(() => {
      setEntitlement((prev) => ({ ...(prev ?? {}), isPro: true, trialExpired: false }));
      setPaywallVisible(false);
    });
  }, []);

  const startModule = useCallback((moduleId) => {
    if (entitlement && !canUseApp(entitlement)) {
      setPaywallVisible(true);
      return;
    }
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
    setCurrentModule(mod);
    setQuestionId(mod.questions[0].id);
    setHistory([]);
    setScreen('guide');
  }, [entitlement]);

  const goHome = useCallback(() => {
    setScreen('home');
    setCurrentModule(null);
    setQuestionId(null);
    setHistory([]);
  }, []);

  const goBack = useCallback(() => {
    if (history.length === 0) {
      goHome();
      return;
    }
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setQuestionId(prev);
    setScreen('guide');
  }, [history, goHome]);

  const handleAnswer = useCallback((nextId) => {
    setHistory(h => [...h, questionId]);
    if (nextId.startsWith('r')) {
      setScreen('result');
    } else {
      setQuestionId(nextId);
    }
  }, [questionId]);

  const restartModule = useCallback(() => {
    setQuestionId(currentModule.questions[0].id);
    setHistory([]);
    setScreen('guide');
  }, [currentModule]);

  const renderHome = () => {
    const locked = !canUseApp(entitlement);
    let banner = null;
    if (entitlement?.isPro) {
      banner = (
        <View style={[styles.banner, styles.bannerPro]}>
          <Text style={styles.bannerProText}>终身会员已解锁 ✓ 全部板块可用</Text>
        </View>
      );
    } else if (entitlement?.trialExpired) {
      banner = (
        <TouchableOpacity style={[styles.banner, styles.bannerLocked]} onPress={() => setPaywallVisible(true)}>
          <Text style={styles.bannerLockedText}>试用已结束 · 点击解锁终身会员（¥12）</Text>
        </TouchableOpacity>
      );
    } else if (entitlement) {
      banner = (
        <TouchableOpacity style={[styles.banner, styles.bannerTrial]} onPress={() => setPaywallVisible(true)}>
          <Text style={styles.bannerTrialText}>
            试用还剩 {entitlement.trialDaysLeft} 天 · 点击提前解锁终身会员（¥12）
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.homeScroll}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>新手决策向导</Text>
          <Text style={styles.heroText}>每次操作前，跟着引导一步步做决策，不再凭感觉炒股。</Text>
        </View>
        {banner}
        <Text style={styles.sectionTitle}>操作板块</Text>
        <View style={styles.grid}>
          {modules.map(m => (
            <TouchableOpacity key={m.id} style={styles.card} onPress={() => startModule(m.id)} activeOpacity={0.9}>
              <Text style={styles.cardIcon}>{m.icon}</Text>
              <Text style={styles.cardTitle}>{m.title}</Text>
              <Text style={styles.cardDesc}>{m.desc}</Text>
              {locked ? <Text style={styles.cardLock}>🔒</Text> : null}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderGuide = () => {
    if (!currentModule) return null;
    const question = currentModule.questions.find(q => q.id === questionId);
    if (!question) return null;
    const total = currentModule.questions.length;
    const currentIndex = currentModule.questions.findIndex(q => q.id === questionId) + 1;
    const progress = currentIndex / total;

    return (
      <ScrollView contentContainerStyle={styles.guideScroll}>
        <View style={styles.guideCard}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.questionNumber}>问题 {currentIndex} / {total}</Text>
          <Text style={styles.questionText}>{question.text}</Text>
          {question.options.map((opt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.optionBtn}
              onPress={() => handleAnswer(opt.next)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionText}>{opt.text}</Text>
            </TouchableOpacity>
          ))}
          {question.hint && (
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>💡 {question.hint}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderResult = () => {
    if (!currentModule) return null;
    const resultId = history[history.length - 1];
    const result = currentModule.results[resultId];
    if (!result) return null;
    const colorMap = {
      ok: COLORS.success,
      warn: COLORS.warning,
      no: COLORS.danger,
    };
    const titleColor = colorMap[result.status];

    return (
      <ScrollView contentContainerStyle={styles.resultScroll}>
        <View style={styles.resultCard}>
          <Text style={styles.resultIcon}>{result.icon}</Text>
          <Text style={[styles.resultTitle, { color: titleColor }]}>{result.title}</Text>
          <Text style={styles.resultSummary}>{result.summary}</Text>
          <View style={styles.actionBox}>
            <Text style={styles.actionTitle}>建议操作</Text>
            {result.actions.map((a, idx) => (
              <View key={idx} style={styles.actionRow}>
                <Text style={styles.actionBullet}>•</Text>
                <Text style={styles.actionText}>{a}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.riskText}>⚠️ 风险提醒：{result.risk}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={restartModule} activeOpacity={0.9}>
            <Text style={styles.primaryBtnText}>重新评估</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={goHome} activeOpacity={0.9}>
            <Text style={styles.secondaryBtnText}>返回首页</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        {screen !== 'home' ? (
          <TouchableOpacity onPress={goBack} style={styles.iconBtn}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
        ) : <View style={styles.iconBtn} />}
        <Text style={styles.headerTitle}>{screen === 'home' || !currentModule ? '小白炒股决策工具' : currentModule.title}</Text>
        {screen !== 'home' ? (
          <TouchableOpacity onPress={goHome} style={styles.iconBtn}>
            <Text style={styles.iconText}>⌂</Text>
          </TouchableOpacity>
        ) : <View style={styles.iconBtn} />}
      </View>
      <View style={styles.main}>
        {screen === 'home' && renderHome()}
        {screen === 'guide' && renderGuide()}
        {screen === 'result' && renderResult()}
      </View>
      <Paywall
        visible={paywallVisible}
        canDismiss
        badgeText={
          entitlement?.isPro
            ? '终身会员'
            : entitlement?.trialExpired
              ? '7 天试用已结束'
              : `试用还剩 ${entitlement?.trialDaysLeft ?? 7} 天`
        }
        onClose={() => setPaywallVisible(false)}
        onPurchased={handlePurchased}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    color: COLORS.text,
  },
  main: {
    flex: 1,
  },
  homeScroll: {
    padding: 16,
  },
  banner: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  bannerPro: {
    backgroundColor: '#dcfce7',
  },
  bannerProText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  bannerLocked: {
    backgroundColor: '#fef3c7',
  },
  bannerLockedText: {
    color: '#b45309',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  bannerTrial: {
    backgroundColor: '#dbeafe',
  },
  bannerTrialText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardLock: {
    position: 'absolute',
    top: 10,
    right: 12,
    fontSize: 14,
  },
  hero: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  guideScroll: {
    padding: 16,
  },
  guideCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  questionNumber: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 28,
    marginBottom: 24,
  },
  optionBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  hintBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  resultScroll: {
    padding: 16,
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  resultIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  resultSummary: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  actionBullet: {
    fontSize: 14,
    color: COLORS.text,
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
  riskText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
});
