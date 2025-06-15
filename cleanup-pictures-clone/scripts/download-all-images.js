#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 创建目录的辅助函数
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ 创建目录: ${dir}`);
  }
}

// 下载图片的辅助函数
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败: ${response.statusCode} ${response.statusMessage}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`  ✅ 下载完成: ${path.basename(filepath)}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {}); // 删除不完整的文件
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadAllImages() {
  console.log('🚀 开始下载项目中所有外部图片...\n');

  const allImages = [
    // HeroSection 示例图片
    {
      url: 'https://ext.same-assets.com/1651265233/1201440311.jpeg',
      directory: 'examples',
      filename: 'cartoon-character.jpeg',
      description: '卡通角色示例'
    },
    {
      url: 'https://ext.same-assets.com/1651265233/406424930.jpeg', 
      directory: 'examples',
      filename: 'pet-ip.jpeg',
      description: '宠物IP示例'
    },
    {
      url: 'https://ext.same-assets.com/1651265233/3769327180.jpeg',
      directory: 'examples', 
      filename: 'character-portrait.jpeg',
      description: '人物形象示例'
    },
    
    // Testimonials 头像
    {
      url: 'https://ext.same-assets.com/1651265233/1641842340.jpeg',
      directory: 'testimonials',
      filename: 'user-avatar.jpeg',
      description: '用户头像'
    },
    
    // BackgroundRemovalCTA 背景图片
    {
      url: 'https://ext.same-assets.com/1651265233/1906157659.jpeg',
      directory: 'cta',
      filename: 'background-removal.jpeg', 
      description: '背景移除CTA图片'
    },
    
    // Partners 合作伙伴logo
    {
      url: 'https://ext.same-assets.com/1651265233/2094254514.png',
      directory: 'partners',
      filename: 'partner-1.png',
      description: '合作伙伴1'
    },
    {
      url: 'https://ext.same-assets.com/1651265233/813913274.svg',
      directory: 'partners', 
      filename: 'partner-2.svg',
      description: '合作伙伴2'
    },
    {
      url: 'https://ext.same-assets.com/1651265233/2853472961.svg',
      directory: 'partners',
      filename: 'partner-3.svg', 
      description: '合作伙伴3'
    },
    {
      url: 'https://ext.same-assets.com/1651265233/88150141.png',
      directory: 'partners',
      filename: 'partner-4.png',
      description: '合作伙伴4'
    },
    {
      url: 'https://ext.same-assets.com/1651265233/862852459.png',
      directory: 'partners',
      filename: 'partner-5.png',
      description: '合作伙伴5'
    },
    
    // APISection 图片 (注意: 这与api-before/after是同一张图)
    {
      url: 'https://ext.same-assets.com/1651265233/915845048.jpeg',
      directory: 'api',
      filename: 'api-demo.jpeg',
      description: 'API演示图片'
    }
  ];

  // 按目录分组下载
  const directories = [...new Set(allImages.map(img => img.directory))];
  
  for (const dir of directories) {
    const targetDir = path.join(process.cwd(), 'public', dir);
    ensureDirectoryExists(targetDir);
  }

  // 下载所有图片
  for (const image of allImages) {
    try {
      console.log(`📥 下载: ${image.description}`);
      console.log(`   目录: ${image.directory}`);
      console.log(`   URL: ${image.url}`);
      
      const targetDir = path.join(process.cwd(), 'public', image.directory);
      const filepath = path.join(targetDir, image.filename);
      
      // 检查文件是否已存在
      if (fs.existsSync(filepath)) {
        console.log(`  ⚠️  文件已存在，跳过: ${image.filename}`);
        continue;
      }
      
      await downloadImage(image.url, filepath);
      
      // 短暂延迟，避免过于频繁的请求
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ 下载失败 ${image.filename}:`, error.message);
    }
  }

  console.log('\n✨ 所有图片下载完成!');
  
  // 列出每个目录的文件
  for (const dir of directories) {
    const targetDir = path.join(process.cwd(), 'public', dir);
    if (fs.existsSync(targetDir)) {
      console.log(`\n📁 ${dir} 目录:`);
      const files = fs.readdirSync(targetDir);
      files.forEach(file => {
        const filepath = path.join(targetDir, file);
        const stats = fs.statSync(filepath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`   📸 ${file} (${sizeKB} KB)`);
      });
    }
  }

  console.log('\n💡 接下来需要更新各个组件文件中的图片路径');
}

// 主函数
async function main() {
  try {
    await downloadAllImages();
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

main(); 