const cheerio = require("cheerio");  // superagent 是一个轻量级、渐进式的请求库，内部依赖 nodejs 原生的请求 api,适用于 nodejs 环境。
const superagent = require("superagent"); // cherrio 是 nodejs 的抓取页面模块，为服务器特别定制的，快速、灵活、实施的 jQuery 核心实现。适合各种 Web 爬虫程序。node.js 版的 jQuery。
const fs = require("fs");
const nodeSchedule = require("node-schedule"); // 定时任务
const weiboURL = "https://s.weibo.com";
const hotSearchURL = weiboURL + "/top/summary?cate=realtimehot";
// Promise 封装 定时调用
function getHotSearchList() {
    return new Promise((resolve, reject) => {
        superagent.get(hotSearchURL, (err, res) => {
            if (err) reject("request error");
            const $ = cheerio.load(res.text);
            let hotList = [];
            $("#pl_top_realtimehot table tbody tr").each(function (index) {
                if (index !== 0) {
                    const $td = $(this).children().eq(1);
                    const link = weiboURL + $td.find("a").attr("href");
                    const text = $td.find("a").text();
                    const hotValue = $td.find("span").text();
                    const icon = $td.find("img").attr("src")
                        ? "https:" + $td.find("img").attr("src")
                        : "";
                    hotList.push({
                        index,
                        link,
                        text,
                        hotValue,
                        icon,
                    });
                }
            });
            hotList.length ? resolve(hotList) : reject("errer");
        });
    });
}
// 6 个占位符从左到右依次代表：秒、分、时、日、月、周几* 表示通配符，匹配任意。当 * 为秒时，表示任意秒都会触发
nodeSchedule.scheduleJob("30 * * * * *", async function () {
    try {
        const hotList = await getHotSearchList();
        // 写入文件
        await fs.writeFileSync(
            `${__dirname}/hotSearch.json`,
            JSON.stringify(hotList),
            "utf-8"
        );
    } catch (error) {
        console.error(error);
    }
});