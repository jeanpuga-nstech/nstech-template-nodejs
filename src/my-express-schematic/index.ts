import { Rule, Tree, SchematicContext, chain, schematic } from '@angular-devkit/schematics';
import { Schema as ExpressBackendSchema } from './schema';
import { strings } from '@angular-devkit/core';

export function expressBackend(options: ExpressBackendSchema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Validações
    if (!options.name) {
      throw new Error('O nome é obrigatório');
    }

    context.logger.info(`Generating Express backend for ${options.name}...`);

    return chain([
      // Cria a estrutura base
      createBaseStructure(options),
      // Gera os arquivos de template
      generateTemplateFiles(options),
      // Adiciona dependências se necessário
      addDependencies(options),
    ])(tree, context);
  };
}

function createBaseStructure(options: ExpressBackendSchema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const basePath = `/${options.path || 'backend'}`;
    
    // Cria diretórios necessários
    const directories = [
      `${basePath}/src`,
      `${basePath}/src/controllers`,
      `${basePath}/src/services`,
      `${basePath}/src/routes`,
      `${basePath}/src/models`,
      `${basePath}/src/middlewares`,
    ];

    directories.forEach(dir => {
      if (!tree.exists(dir)) {
        tree.create(dir, '');
      }
    });

    return tree;
  };
}

function generateTemplateFiles(options: ExpressBackendSchema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const basePath = `/${options.path || 'backend'}`;
    const templatePath = './files';
    
    // Template context
    const templateContext = {
      ...options,
      ...strings,
      classify: strings.classify,
      dasherize: strings.dasherize,
      camelize: strings.camelize,
      capitalize: strings.capitalize,
    };

    // Arquivos a serem gerados
    const files = [
      'server.ts',
      '__name@dasherize__.controller.ts',
      '__name@dasherize__.service.ts',
      '__name@dasherize__.route.ts',
    ];

    files.forEach(file => {
      const source = tree.read(`${templatePath}/${file}`);
      if (source) {
        const content = source.toString();
        const transformedContent = applyTemplates(content, templateContext);
        
        let targetPath = `${basePath}/src/${file}`;
        
        // Aplica transformação de nome para arquivos com template
        if (file.includes('__name@dasherize__')) {
          targetPath = `${basePath}/src/${file.replace('__name@dasherize__', strings.dasherize(options.name))}`;
        }
        
        tree.create(targetPath, transformedContent);
      }
    });

    return tree;
  };
}

function applyTemplates(content: string, context: any): string {
  return content
    .replace(/__name__/g, context.name)
    .replace(/__NAME__/g, context.name.toUpperCase())
    .replace(/__classify__/g, context.classify(context.name))
    .replace(/__dasherize__/g, context.dasherize(context.name))
    .replace(/__camelize__/g, context.camelize(context.name))
    .replace(/__capitalize__/g, context.capitalize(context.name))
    .replace(/__port__/g, context.port);
}

function addDependencies(options: ExpressBackendSchema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const basePath = `/${options.path || 'backend'}`;
    const packageJsonPath = `${basePath}/package.json`;

    if (!tree.exists(packageJsonPath)) {
      const packageJson = {
        name: `backend-${strings.dasherize(options.name)}`,
        version: '1.0.0',
        description: `Backend for ${options.name}`,
        main: 'src/server.ts',
        scripts: {
          start: 'node src/server.ts',
          dev: 'nodemon src/server.ts',
          build: 'tsc'
        },
        dependencies: {
          express: '^4.18.0',
          cors: '^2.8.5',
          helmet: '^7.0.0',
          'express-rate-limit': '^6.0.0'
        },
        devDependencies: {
          nodemon: '^2.0.0',
          typescript: '^4.0.0',
          '@types/express': '^4.17.0',
          '@types/node': '^16.0.0'
        }
      };

      // Adiciona dependências específicas do banco de dados
      switch (options.database) {
        case 'mongodb':
          packageJson.dependencies['mongoose'] = '^6.0.0';
          break;
        case 'postgresql':
          packageJson.dependencies['pg'] = '^8.0.0';
          packageJson.dependencies['sequelize'] = '^6.0.0';
          break;
        case 'mysql':
          packageJson.dependencies['mysql2'] = '^2.0.0';
          packageJson.dependencies['sequelize'] = '^6.0.0';
          break;
      }

      // Adiciona dependências de auth se solicitado
      if (options.auth) {
        packageJson.dependencies['jsonwebtoken'] = '^8.0.0';
        packageJson.dependencies['bcryptjs'] = '^2.0.0';
      }

      tree.create(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    return tree;
  };
}