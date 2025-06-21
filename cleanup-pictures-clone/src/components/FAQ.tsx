import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export default function FAQ() {
  const faqs = [
    {
      id: 'what-is-ip',
      question: '什么是IP形象生成？',
      answer: 'IP形象生成是通过AI技术，将用户上传的图片和描述转化为独特卡通角色的过程。我们的AI能够理解图片特征并结合用户的风格要求，创造出具有个性化特色的IP形象。'
    },
    {
      id: 'how-crowdfunding-works',
      question: '众筹生产模式是如何运作的？',
      answer: '当一个IP周边产品获得30人或以上的预订时，我们会启动实物生产流程。用户只需支付平台服务费，生产成本由所有预订用户分摊，这样既降低了个人成本，又确保了产品质量。生产周期通常为15-20个工作日。'
    },
    {
      id: 'supported-products',
      question: '支持哪些类型的周边产品？',
      answer: (
        <span>
          我们支持超过<span className="highlight-green">30种</span>周边产品类型，包括：手机壳、钥匙扣、3D手办、冰箱贴、马克杯、T恤、帆布袋、徽章、贴纸、鼠标垫等。产品类型会根据用户需求不断增加。
        </span>
      )
    },
    {
      id: 'pricing',
      question: 'Popverse.ai的费用如何？',
      answer: (
        <span>
          我们提供<span className="highlight-green">免费体验版</span>（每月3次生成），
          <span className="highlight-green">创作者版¥29/月</span>（无限生成），以及
          <span className="highlight-green">商业版¥199/月</span>（包含商用授权）。实物生产费用由预订用户众筹分摊。
        </span>
      )
    },
    {
      id: 'quality-guarantee',
      question: '如何保证产品质量？',
      answer: '我们与专业制造商合作，所有产品都经过严格的质量检测。如果收到的产品存在质量问题，我们提供30天内免费退换服务。同时，我们会根据用户反馈不断优化生产工艺。'
    },
    {
      id: 'ip-rights',
      question: '生成的IP形象版权归谁所有？',
      answer: '个人用户生成的IP形象版权归用户所有。商业用户需要购买商用授权才能用于商业用途。我们保证不会将用户的IP形象用于其他商业目的，用户拥有完全的使用权和分享权。'
    },
    {
      id: 'customization',
      question: '可以对生成的IP形象进行修改吗？',
      answer: '可以！我们提供多轮调整服务。如果对生成的IP形象不满意，您可以通过修改描述或上传新的参考图片来重新生成。创作者版和商业版用户还可以申请人工精修服务。'
    },
    {
      id: 'api',
      question: '如何使用开发者API？',
      answer: '我们提供RESTful API接口，开发者可以将IP生成功能集成到自己的应用中。API支持图片上传、风格描述、批量生成等功能。详细文档和代码示例请查看我们的开发者文档。'
    },
    {
      id: 'shipping',
      question: '实物产品如何配送？',
      answer: '我们支持全国配送，一般采用顺丰或中通快递。生产完成后会在3-5个工作日内发货。用户可以在订单详情页面实时查看生产进度和物流信息。'
    },
    {
      id: 'refund-policy',
      question: '退款政策是什么？',
      answer: '订阅服务支持7天无理由退款。众筹产品在未开始生产前可以申请退款，开始生产后无法退款。如果是产品质量问题，我们提供换货或退款服务。具体政策请查看用户协议。'
    }
  ];

  return (
    <section id="faq" className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <h2 className="text-4xl lg:text-5xl font-bold text-center mb-16">
          常见问题
        </h2>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="bg-white rounded-lg border border-gray-200 px-6 hover:shadow-md transition-shadow"
            >
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline py-6 text-gray-800">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 pb-6 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <div className="bg-cleanup-green rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-black mb-4">还有其他问题？</h3>
            <p className="text-black/80 mb-6">
              我们的客服团队随时为您解答疑问
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:zhangjunfei@mahuakeji.com?subject=在线客服咨询&body=您好，我需要咨询以下问题："
                className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors text-center"
              >
                联系客服
              </a>
              <a
                href="mailto:zhangjunfei@mahuakeji.com?subject=产品咨询&body=您好，我想了解更多关于Popverse.ai的信息："
                className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors border border-black/20 text-center"
              >
                发送邮件
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
