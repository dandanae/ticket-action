"use strict";
import * as core from "@actions/core";
import axios from "axios";

(async () => {
  const [prodId, scheduleNosRaw, cookie, webhookUrl, logWebhookUrl] = [
    "product-id",
    "schedule-id",
    "cookie",
    "discord-webhook-url",
    "discord-log-webhook-url",
  ].map((name) => {
    const value = core.getInput(name);
    if (!value) {
      throw new Error(
        `melon-ticket-actions: Please set ${name} input parameter`,
      );
    }
    return value;
  });

  const scheduleNos = scheduleNosRaw.split(",").map((s) => s.trim());

  const baseHeaders = {
    "Cookie": cookie,
    "Accept":
      "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Host": "ticket.melon.com",
    "Referer": "https://ticket.melon.com/reservation/popup/stepBlock.htm",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
  };

  // === 블록 리스트 조회 ===
  async function getBlockList(scheduleNo: string) {
    const body = new URLSearchParams({
      prodId,
      scheduleNo,
      pocCode: "SC0002",
    });

    const res = await axios.post(
      "https://ticket.melon.com/tktapi/product/getAreaMap.json?v=1&callback=getBlockGradeSeatMapCallBack",
      body,
      { headers: baseHeaders },
    );

    const json = String(res.data)
      .replace("/**/getBlockGradeSeatMapCallBack(", "")
      .replace(");", "");
    const datas = JSON.parse(json);

    return Array.isArray(datas.seatData.da.sb) ? datas.seatData.da.sb : [];
  }

  // === 블록에 남은 좌석 조회 ===
  async function getRemainSeatInBlock(scheduleNo: string, block: any) {
    const body = new URLSearchParams({
      prodId,
      scheduleNo,
      pocCode: "SC0002",
      blockId: String(block.sbid),
      corpCodeNo: "",
    });

    const res = await axios.post(
      "https://ticket.melon.com/tktapi/product/seat/seatMapList.json?v=1&callback=getSeatListCallBack",
      body,
      { headers: baseHeaders },
    );

    const json = String(res.data)
      .replace("/**/getSeatListCallBack(", "")
      .replace(");", "");
    const datas = JSON.parse(json);
    let count = 0;

    if (datas.seatData) {
      count = datas.seatData.st[0].ss.filter(
        (st: any) => st.sid != null,
      ).length;
    }

    return count;
  }

  // === Discord 통지 ===
  async function sendMessage(url: string, content: string) {
    await axios.post(url, { content });
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  await sendMessage(logWebhookUrl, "서칭 시작!");

  for (const scheduleNo of scheduleNos) {
    const day =
      scheduleNo === "100001"
        ? "금요일"
        : scheduleNo === "100002"
        ? "토요일"
        : scheduleNo === "100003"
        ? "일요일"
        : "";

    const blocks = await getBlockList(scheduleNo);
    for (const block of blocks) {
      await sleep(1000);

      const count = await getRemainSeatInBlock(scheduleNo, block);
      if (count > 0) {
        await sendMessage(
          webhookUrl,
          `[${day}] ${block.sntv.a} 구역에 잔여 좌석 ${count}개 발생! https://ticket.melon.com/performance/index.htm?prodId=${prodId}`,
        );
      }
    }
  }

  await sendMessage(logWebhookUrl, "서칭 끝");
})().catch((e) => {
  const webhookUrl = core.getInput("discord-webhook-url");
  axios.post(webhookUrl, { content: `오류 발생! ${e.message}` });
  console.error(e.stack); // tslint:disable-line
  core.setFailed(e.message);
});
