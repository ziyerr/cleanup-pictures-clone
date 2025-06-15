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

// 从URL中提取文件扩展名
function getFileExtension(url) {
  const urlParts = url.split('.');
  const lastPart = urlParts[urlParts.length - 1];
  // 如果最后一部分看起来像扩展名，就使用它，否则默认为jpg
  return lastPart.match(/^(jpg|jpeg|png|gif|webp)$/i) ? lastPart : 'jpg';
}

async function downloadUseCaseImages() {
  console.log('🚀 开始下载 UseCases 组件中的图片...\n');

  // 定义所有图片URL和对应的本地文件名
  const imageDownloads = [
    // 个人用户
    {
      url: 'https://ext.same-assets.com/1651265233/2928208650.jpeg',
      category: 'personal',
      type: 'before',
      filename: 'personal-before.jpeg'
    },
    {
      url: 'https://ext.same-assets.com/1651265233/106988532.jpeg',
      category: 'personal', 
      type: 'after',
      filename: 'personal-after.jpeg'
    },
    // 创意设计师
    {
      url: 'https://ext.same-assets.com/1651265233/1447566140.jpeg',
      category: 'designer',
      type: 'before',
      filename: 'designer-before.jpeg'
    },
    {
      url: 'https://ext.same-assets.com/1651265233/3287272718.jpeg',
      category: 'designer',
      type: 'after', 
      filename: 'designer-after.jpeg'
    },
    // 电商品牌
    {
      url: 'https://ext.same-assets.com/1651265233/1309645506.jpeg',
      category: 'ecommerce',
      type: 'before',
      filename: 'ecommerce-before.jpeg'
    },
    {
      url: 'https://ext.same-assets.com/1651265233/3429307030.jpeg',
      category: 'ecommerce',
      type: 'after',
      filename: 'ecommerce-after.jpeg'
    },
    // 文化IP
    {
      url: 'https://ext.same-assets.com/1651265233/370607586.jpeg',
      category: 'cultural',
      type: 'before',
      filename: 'cultural-before.jpeg'
    },
    {
      url: 'https://ext.same-assets.com/1651265233/3237102190.jpeg',
      category: 'cultural',
      type: 'after',
      filename: 'cultural-after.jpeg'
    },
    // 宠物主人
    {
      url: 'https://ext.same-assets.com/1651265233/3671485085.jpeg',
      category: 'pet',
      type: 'before',
      filename: 'pet-before.jpeg'
    },
    {
      url: 'https://ext.same-assets.com/1651265233/3280904716.jpeg',
      category: 'pet',
      type: 'after',
      filename: 'pet-after.jpeg'
    },
    // 开发者API (before和after是同一张图)
    {
      url: 'https://ext.same-assets.com/1651265233/915845048.jpeg',
      category: 'api',
      type: 'before',
      filename: 'api-before.jpeg'
    },
    {
      url: 'https://ext.same-assets.com/1651265233/915845048.jpeg',
      category: 'api',
      type: 'after',
      filename: 'api-after.jpeg'
    }
  ];

  // 创建目标目录
  const targetDir = path.join(process.cwd(), 'public', 'use-cases');
  ensureDirectoryExists(targetDir);

  console.log(`📁 目标目录: ${targetDir}\n`);

  // 下载所有图片
  for (const image of imageDownloads) {
    try {
      console.log(`📥 下载: ${image.category} - ${image.type}`);
      console.log(`   URL: ${image.url}`);
      
      const filepath = path.join(targetDir, image.filename);
      await downloadImage(image.url, filepath);
      
      // 短暂延迟，避免过于频繁的请求
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ 下载失败 ${image.filename}:`, error.message);
    }
  }

  console.log('\n✨ 所有图片下载完成!');
  console.log('\n📋 下载的文件列表:');
  
  // 列出下载的文件
  try {
    const files = fs.readdirSync(targetDir);
    files.forEach(file => {
      const filepath = path.join(targetDir, file);
      const stats = fs.statSync(filepath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`   📸 ${file} (${sizeKB} KB)`);
    });
  } catch (error) {
    console.error('❌ 无法列出文件:', error.message);
  }

  console.log('\n💡 接下来需要更新 UseCases.tsx 文件中的图片路径');
}

// 主函数
async function main() {
  try {
    await downloadUseCaseImages();
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

main(); 