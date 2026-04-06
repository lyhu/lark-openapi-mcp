import {
  initMcpServerWithTransport,
  initOAPIMcpServer,
  initRecallMcpServer,
} from '../../../src/mcp-server/shared/init';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { LoginHandler } from '../../../src/cli/login-handler';
import { TokenMode } from '../../../src/mcp-tool/types';

// 模拟依赖项
jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    tool: jest.fn().mockImplementation((name, description, schema, handler) => {
      handler();
    }),
  })),
}));

// 模拟mcp-tool模块
jest.mock('../../../src/mcp-tool', () => {
  return {
    LarkMcpTool: jest.fn().mockImplementation(() => ({
      updateUserAccessToken: jest.fn(),
      registerMcpServer: jest.fn(),
    })),
    defaultToolNames: ['default-tool-1', 'default-tool-2'],
    presetTools: {
      'preset.default': ['default-tool-1', 'default-tool-2'],
    },
    RecallTool: {
      name: 'RecallTool',
      description: 'RecallTool description',
      schema: jest.fn(),
      handler: jest.fn(),
    },
  };
});

jest.mock('../../../src/mcp-server/transport', () => ({
  initSSEServer: jest.fn().mockImplementation((getNewServer) => {
    getNewServer?.();
  }),
  initStreamableServer: jest.fn().mockImplementation((getNewServer) => {
    getNewServer?.();
  }),
  initStdioServer: jest.fn().mockImplementation((getNewServer) => {
    getNewServer?.();
  }),
}));

jest.mock('../../../src/cli/login-handler', () => ({
  LoginHandler: {
    ensureLogin: jest.fn().mockResolvedValue(undefined),
  },
}));

// 保存原始的环境变量和console.error
const originalEnv = process.env;
const originalConsoleError = console.error;
const originalProcessExit = process.exit;

describe('initOAPIMcpServer', () => {
  beforeEach(() => {
    // 重置模拟
    jest.clearAllMocks();

    // 模拟环境变量
    process.env = { ...originalEnv };

    // 模拟 console.error
    console.error = jest.fn();

    // 模拟 process.exit
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    // 恢复原始环境变量和函数
    process.env = originalEnv;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  it('应该使用提供的凭证初始化服务器', () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      host: 'localhost',
      port: 3000,
    };

    initOAPIMcpServer(options);

    expect(McpServer).toHaveBeenCalled();
    // 从mcp-tool模块导入LarkMcpTool
    const { LarkMcpTool } = require('../../../src/mcp-tool');
    expect(LarkMcpTool).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
      }),
      undefined,
    );
  });

  it('如果提供了userAccessToken，应该调用updateUserAccessToken', () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      userAccessToken: 'test-user-access-token',
      host: 'localhost',
      port: 3000,
    };

    const { larkClient } = initOAPIMcpServer(options);

    expect(larkClient.updateUserAccessToken).toHaveBeenCalledWith('test-user-access-token');
  });

  it('应该处理数组形式的tools参数', () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      tools: ['tool1', 'tool2'],
      host: 'localhost',
      port: 3000,
    };

    initOAPIMcpServer(options);

    // 从mcp-tool模块导入LarkMcpTool
    const { LarkMcpTool } = require('../../../src/mcp-tool');
    expect(LarkMcpTool).toHaveBeenCalledWith(
      expect.objectContaining({
        toolsOptions: expect.objectContaining({
          allowTools: ['tool1', 'tool2'],
        }),
      }),
      undefined,
    );
  });

  it('应该处理字符串形式的tools参数', () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      tools: ['tool1', 'tool2'],
      host: 'localhost',
      port: 3000,
    };

    initOAPIMcpServer(options);

    // 从mcp-tool模块导入LarkMcpTool
    const { LarkMcpTool } = require('../../../src/mcp-tool');
    expect(LarkMcpTool).toHaveBeenCalledWith(
      expect.objectContaining({
        toolsOptions: expect.objectContaining({
          allowTools: ['tool1', 'tool2'],
        }),
      }),
      undefined,
    );
  });

  it('如果凭证缺失，应该退出程序', () => {
    const options = {
      host: 'localhost',
      port: 3000,
    };

    try {
      initOAPIMcpServer(options);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect(console.error).toHaveBeenCalled();
  });

  it('应该处理preset.default工具集', () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      tools: ['preset.default', 'extra-tool'],
      host: 'localhost',
      port: 3000,
    };

    initOAPIMcpServer(options);

    // 从mcp-tool模块导入LarkMcpTool
    const { LarkMcpTool } = require('../../../src/mcp-tool');
    // 验证LarkMcpTool被调用且包含toolsOptions
    expect(LarkMcpTool).toHaveBeenCalledWith(
      expect.objectContaining({
        toolsOptions: expect.objectContaining({
          allowTools: expect.any(Array),
        }),
      }),
      undefined,
    );

    // 验证tools被正确传递
    const calls = LarkMcpTool.mock.calls;
    const toolsOptions = calls[calls.length - 1][0].toolsOptions;
    expect(toolsOptions.allowTools).toEqual(expect.arrayContaining(['preset.default', 'extra-tool']));
  });
});

describe('initRecallMcpServer', () => {
  it('应该正确初始化Recall MCP服务器', () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      host: 'localhost',
      port: 3000,
      mode: 'stdio' as const,
    };

    initRecallMcpServer(options);

    expect(McpServer).toHaveBeenCalled();
  });
});

describe('initMcpServerWithTransport', () => {
  it('应该正确初始化OAPI MCP服务器', () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      host: 'localhost',
      port: 3000,
      mode: 'stdio' as const,
    };
    initMcpServerWithTransport('oapi', options);
  });

  it('应该正确初始化OAPI SSE MCP服务器', () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      host: 'localhost',
      port: 3000,
      mode: 'sse' as const,
    };
    initMcpServerWithTransport('oapi', options);
  });

  it('应该正确初始化OAPI streamable MCP服务器', () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      host: 'localhost',
      port: 3000,
      mode: 'streamable' as const,
    };
    initMcpServerWithTransport('oapi', options);
  });

  it('应该在 user_access_token 模式且没有显式 token 时先确保登录', async () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      domain: 'https://open.feishu.cn',
      host: '0.0.0.0',
      port: 3000,
      mode: 'streamable' as const,
      tokenMode: TokenMode.USER_ACCESS_TOKEN,
    };

    await initMcpServerWithTransport('oapi', options);

    expect(LoginHandler.ensureLogin).toHaveBeenCalledWith({
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      domain: 'https://open.feishu.cn',
      host: 'localhost',
      port: '3000',
      scope: undefined,
    });
  });

  it('显式传入 userAccessToken 时不应该触发自动登录', async () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      domain: 'https://open.feishu.cn',
      host: '0.0.0.0',
      port: 3000,
      mode: 'streamable' as const,
      tokenMode: TokenMode.USER_ACCESS_TOKEN,
      userAccessToken: 'test-user-token',
    };

    await initMcpServerWithTransport('oapi', options);

    expect(LoginHandler.ensureLogin).not.toHaveBeenCalled();
  });

  it('非 user_access_token 模式不应该触发自动登录', async () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      domain: 'https://open.feishu.cn',
      host: '0.0.0.0',
      port: 3000,
      mode: 'streamable' as const,
      tokenMode: TokenMode.TENANT_ACCESS_TOKEN,
    };

    await initMcpServerWithTransport('oapi', options);

    expect(LoginHandler.ensureLogin).not.toHaveBeenCalled();
  });

  it('应该正确初始化Recall MCP服务器', () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      host: 'localhost',
      port: 3000,
      mode: 'stdio' as const,
    };

    initMcpServerWithTransport('recall', options);
  });

  it('应该在userAccessToken和oauth同时存在时抛出错误', async () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      host: 'localhost',
      port: 3000,
      mode: 'stdio' as const,
      userAccessToken: 'test-token',
      oauth: true,
    };

    await expect(initMcpServerWithTransport('oapi', options)).rejects.toThrow(
      'userAccessToken and oauth cannot be used together',
    );
  });

  it('应该在无效的服务器类型时抛出错误', async () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      host: 'localhost',
      port: 3000,
      mode: 'stdio' as const,
    };

    await expect(initMcpServerWithTransport('invalid' as any, options)).rejects.toThrow('Invalid server type');
  });

  it('应该在无效的模式时抛出错误', async () => {
    const options = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      host: 'localhost',
      port: 3000,
      mode: 'invalid' as any,
    };

    await expect(initMcpServerWithTransport('oapi', options)).rejects.toThrow('Invalid mode:invalid');
  });
});
