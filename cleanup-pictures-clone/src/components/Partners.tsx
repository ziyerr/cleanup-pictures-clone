export default function Partners() {
  const partners = [
    {
      name: '腾讯',
      logo: 'https://ext.same-assets.com/1651265233/2094254514.png',
      alt: '腾讯'
    },
    {
      name: '字节跳动',
      logo: 'https://ext.same-assets.com/1651265233/813913274.svg',
      alt: '字节跳动'
    },
    {
      name: '小红书',
      logo: 'https://ext.same-assets.com/1651265233/2853472961.svg',
      alt: '小红书'
    },
    {
      name: 'B站',
      logo: 'https://ext.same-assets.com/1651265233/88150141.png',
      alt: 'B站'
    },
    {
      name: '泡泡玛特',
      logo: 'https://ext.same-assets.com/1651265233/862852459.png',
      alt: '泡泡玛特'
    }
  ];

  return (
    <section className="bg-cleanup-green py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Title */}
        <h2 className="text-4xl lg:text-5xl font-bold text-black mb-8">
          赋能<span className="highlight-black">优秀创作者</span>
        </h2>

        <p className="text-xl text-black/80 mb-16 max-w-3xl mx-auto">
          与知名品牌和平台合作，为千万创作者提供IP生成和周边制作服务
        </p>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12 items-center justify-items-center">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="flex items-center justify-center w-full h-16 lg:h-20 group"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 transition-all duration-300 group-hover:bg-white/30 group-hover:scale-105">
                <img
                  src={partner.logo}
                  alt={partner.alt}
                  className="max-w-full max-h-full object-contain filter brightness-0 group-hover:brightness-100 transition-all duration-300"
                  style={{ maxWidth: '120px', maxHeight: '40px' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Success Stories */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-black/20">
            <div className="text-3xl font-bold text-black mb-2">50万+</div>
            <p className="text-black/80">创作者使用</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-black/20">
            <div className="text-3xl font-bold text-black mb-2">1000万+</div>
            <p className="text-black/80">IP形象生成</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-black/20">
            <div className="text-3xl font-bold text-black mb-2">100万+</div>
            <p className="text-black/80">周边产品制作</p>
          </div>
        </div>
      </div>
    </section>
  );
}
