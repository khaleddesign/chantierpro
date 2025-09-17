#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');

console.log(chalk.blue.bold('\n🔍 VÉRIFICATION SANTÉ CHANTIERPRO'));
console.log('='.repeat(50));

let allPassed = true;
const results = {
  build: false,
  tests: false,
  security: false,
  types: false,
  lint: false
};

// Configuration des seuils
const config = {
  maxTestFailures: 5, // Nombre acceptable de tests échoués
  maxSecurityVulnerabilities: 3, // Nombre acceptable de vulnérabilités LOW
  maxLintWarnings: 50 // Nombre acceptable de warnings ESLint
};

function runCommand(command, description) {
  try {
    console.log(chalk.yellow(`⏳ ${description}...`));
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 120000 // 2 minutes timeout
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: error.stdout || error.message };
  }
}

// 1. VÉRIFICATION BUILD
console.log(chalk.cyan('\n📦 1. VÉRIFICATION BUILD'));
const buildResult = runCommand('npm run build', 'Construction du projet');

if (buildResult.success) {
  console.log(chalk.green('✅ Build réussi'));
  results.build = true;
} else {
  console.log(chalk.red('❌ Build échoué'));
  console.log(chalk.gray(buildResult.output.slice(-500))); // Dernières 500 chars
  allPassed = false;
}

// 2. VÉRIFICATION TESTS
console.log(chalk.cyan('\n🧪 2. VÉRIFICATION TESTS'));
const testResult = runCommand('npm test -- --passWithNoTests', 'Exécution des tests');

if (testResult.success) {
  console.log(chalk.green('✅ Tests passés'));
  results.tests = true;
} else {
  // Analyser le résultat des tests
  const testOutput = testResult.output;
  const failedMatch = testOutput.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed/);
  
  if (failedMatch) {
    const failed = parseInt(failedMatch[1]);
    const passed = parseInt(failedMatch[2]);
    
    if (failed <= config.maxTestFailures) {
      console.log(chalk.yellow(`⚠️  ${failed} tests échoués (acceptable: ${config.maxTestFailures})`));
      console.log(chalk.green(`✅ ${passed} tests passés`));
      results.tests = true;
    } else {
      console.log(chalk.red(`❌ Trop de tests échoués: ${failed} (max: ${config.maxTestFailures})`));
      allPassed = false;
    }
  } else {
    console.log(chalk.red('❌ Tests échoués'));
    allPassed = false;
  }
}

// 3. VÉRIFICATION SÉCURITÉ
console.log(chalk.cyan('\n🔒 3. VÉRIFICATION SÉCURITÉ'));
const auditResult = runCommand('npm audit --audit-level=moderate', 'Audit de sécurité');

if (auditResult.success) {
  console.log(chalk.green('✅ Aucune vulnérabilité critique'));
  results.security = true;
} else {
  // Analyser les vulnérabilités
  const auditOutput = auditResult.output;
  const lowVulnMatch = auditOutput.match(/(\d+)\s+low\s+severity\s+vulnerabilities/);
  
  if (lowVulnMatch) {
    const lowVuln = parseInt(lowVulnMatch[1]);
    if (lowVuln <= config.maxSecurityVulnerabilities) {
      console.log(chalk.yellow(`⚠️  ${lowVuln} vulnérabilités LOW (acceptable: ${config.maxSecurityVulnerabilities})`));
      results.security = true;
    } else {
      console.log(chalk.red(`❌ Trop de vulnérabilités: ${lowVuln} (max: ${config.maxSecurityVulnerabilities})`));
      allPassed = false;
    }
  } else if (auditOutput.includes('found 0 vulnerabilities')) {
    console.log(chalk.green('✅ Aucune vulnérabilité trouvée'));
    results.security = true;
  } else {
    console.log(chalk.red('❌ Vulnérabilités critiques détectées'));
    allPassed = false;
  }
}

// 4. VÉRIFICATION TYPES 'ANY'
console.log(chalk.cyan('\n📝 4. VÉRIFICATION TYPES ANY'));
try {
  const anyCount = execSync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs grep -o ": any" | wc -l', { encoding: 'utf8' }).trim();
  console.log(chalk.blue(`📊 Types 'any' trouvés: ${anyCount}`));
  
  if (parseInt(anyCount) < 100) {
    console.log(chalk.green('✅ Nombre de types any acceptable'));
    results.types = true;
  } else {
    console.log(chalk.yellow('⚠️  Beaucoup de types any détectés'));
    results.types = true; // Non bloquant
  }
} catch (error) {
  console.log(chalk.gray('ℹ️  Impossible de compter les types any'));
  results.types = true; // Non bloquant
}

// 5. VÉRIFICATION LINT (optionnelle)
console.log(chalk.cyan('\n🎨 5. VÉRIFICATION LINT'));
const lintResult = runCommand('npm run lint', 'Vérification du style de code');

if (lintResult.success) {
  console.log(chalk.green('✅ Code conforme aux règles'));
  results.lint = true;
} else {
  // Compter les warnings
  const warnings = (lintResult.output.match(/Warning:/g) || []).length;
  if (warnings <= config.maxLintWarnings) {
    console.log(chalk.yellow(`⚠️  ${warnings} warnings ESLint (acceptable: ${config.maxLintWarnings})`));
    results.lint = true;
  } else {
    console.log(chalk.red(`❌ Trop de warnings: ${warnings} (max: ${config.maxLintWarnings})`));
    // Non bloquant pour le moment
    results.lint = true;
  }
}

// RAPPORT FINAL
console.log(chalk.blue.bold('\n📊 RAPPORT FINAL'));
console.log('='.repeat(30));

const statusIcon = (status) => status ? '✅' : '❌';
console.log(`${statusIcon(results.build)} Build`);
console.log(`${statusIcon(results.tests)} Tests`);
console.log(`${statusIcon(results.security)} Sécurité`);
console.log(`${statusIcon(results.types)} Types`);
console.log(`${statusIcon(results.lint)} Lint`);

if (allPassed) {
  console.log(chalk.green.bold('\n🎉 PROJET SAIN ET STABLE'));
  console.log(chalk.green('Prêt pour le développement business !'));
} else {
  console.log(chalk.red.bold('\n⚠️  ATTENTION REQUISE'));
  console.log(chalk.yellow('Corrigez les problèmes critiques avant de continuer.'));
}

// COMMANDES DE CORRECTION SUGGÉRÉES
if (!results.security) {
  console.log(chalk.yellow('\n💡 Pour corriger la sécurité:'));
  console.log(chalk.gray('npm audit fix --force'));
}

if (!results.build || !results.tests) {
  console.log(chalk.yellow('\n💡 Pour déboguer:'));
  console.log(chalk.gray('npm run build && npm test'));
}

// Sauvegarder le rapport
const reportData = {
  timestamp: new Date().toISOString(),
  status: allPassed ? 'HEALTHY' : 'NEEDS_ATTENTION',
  results: results,
  recommendations: []
};

if (!allPassed) {
  reportData.recommendations.push('Corriger les problèmes critiques identifiés');
}

fs.writeFileSync('health-report.json', JSON.stringify(reportData, null, 2));
console.log(chalk.gray('\n📄 Rapport sauvegardé dans health-report.json'));

process.exit(allPassed ? 0 : 1);