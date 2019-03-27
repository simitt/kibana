/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { KpiNetworkData } from '../../graphql/types';
import { FrameworkAdapter, FrameworkRequest } from '../framework';

import { ElasticsearchKpiNetworkAdapter } from './elasticsearch_adapter';
import { mockMsearchOptions, mockOptions, mockRequest, mockResponse, mockResult } from './mock';
import * as generalQueryDsl from './query_general.dsl';
import * as uniquePrvateIpQueryDsl from './query_unique_private_ips.dsl';

describe('Network Kpi elasticsearch_adapter', () => {
  const mockCallWithRequest = jest.fn();
  const mockFramework: FrameworkAdapter = {
    version: 'mock',
    callWithRequest: mockCallWithRequest,
    exposeStaticDir: jest.fn(),
    registerGraphQLEndpoint: jest.fn(),
    getIndexPatternsService: jest.fn(),
  };
  let mockBuildQuery: jest.SpyInstance;
  let mockBuildUniquePrvateIpsQuery: jest.SpyInstance;
  let EsKpiNetwork: ElasticsearchKpiNetworkAdapter;
  let data: KpiNetworkData;

  describe('getKpiNetwork - call stack', () => {
    beforeAll(async () => {
      mockCallWithRequest.mockResolvedValue(mockResponse);
      jest.mock('../framework', () => ({
        callWithRequest: mockCallWithRequest,
      }));
      mockBuildQuery = jest.spyOn(generalQueryDsl, 'buildGeneralQuery').mockReturnValue([]);
      mockBuildUniquePrvateIpsQuery = jest
        .spyOn(uniquePrvateIpQueryDsl, 'buildUniquePrvateIpQuery')
        .mockReturnValue([]);
      EsKpiNetwork = new ElasticsearchKpiNetworkAdapter(mockFramework);
      data = await EsKpiNetwork.getKpiNetwork(mockRequest as FrameworkRequest, mockOptions);
    });

    afterAll(() => {
      mockCallWithRequest.mockReset();
      mockBuildQuery.mockRestore();
      mockBuildUniquePrvateIpsQuery.mockRestore();
    });

    test('should build general query with correct option', () => {
      expect(mockBuildQuery).toHaveBeenCalledWith(mockOptions);
    });

    test('should build query for unique private ip (source) with correct option', () => {
      expect(mockBuildUniquePrvateIpsQuery).toHaveBeenCalledWith('source', mockOptions);
    });

    test('should build query for unique private ip (destination) with correct option', () => {
      expect(mockBuildUniquePrvateIpsQuery).toHaveBeenCalledWith('destination', mockOptions);
    });

    test('should send msearch request', () => {
      expect(mockCallWithRequest).toHaveBeenCalledWith(mockRequest, 'msearch', mockMsearchOptions);
    });
  });

  describe('Happy Path - get Data', () => {
    beforeAll(async () => {
      mockCallWithRequest.mockResolvedValue(mockResponse);
      jest.mock('../framework', () => ({
        callWithRequest: mockCallWithRequest,
      }));
      EsKpiNetwork = new ElasticsearchKpiNetworkAdapter(mockFramework);
      data = await EsKpiNetwork.getKpiNetwork(mockRequest as FrameworkRequest, mockOptions);
    });

    afterAll(() => {
      mockCallWithRequest.mockReset();
    });

    test('getKpiNetwork - response with data', () => {
      expect(data).toEqual(mockResult);
    });
  });

  describe('Unhappy Path - No data', () => {
    beforeAll(async () => {
      mockCallWithRequest.mockResolvedValue(null);
      jest.mock('../framework', () => ({
        callWithRequest: mockCallWithRequest,
      }));
      EsKpiNetwork = new ElasticsearchKpiNetworkAdapter(mockFramework);
      data = await EsKpiNetwork.getKpiNetwork(mockRequest as FrameworkRequest, mockOptions);
    });

    afterAll(() => {
      mockCallWithRequest.mockReset();
    });

    test('getKpiNetwork - response without data', async () => {
      expect(data).toEqual({
        networkEvents: null,
        uniqueFlowId: null,
        activeAgents: null,
        uniqueSourcePrivateIps: null,
        uniqueDestinationPrivateIps: null,
      });
    });
  });
});
