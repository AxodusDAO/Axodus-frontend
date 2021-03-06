import { BigNumber } from "@ethersproject/bignumber";
import { useQuery } from "react-query";
import { NetworkId } from "src/constants";
import { AddressMap } from "src/constants/addresses";
import { nonNullable, queryAssertion } from "src/helpers";

import { useWeb3Context } from ".";
import { useDynamicTokenContract } from "./useContract";

export const contractAllowanceQueryKey = (
  address?: string,
  networkId?: NetworkId,
  tokenMap?: AddressMap,
  contractMap?: AddressMap,
) => ["useContractAllowances", address, networkId, tokenMap, contractMap].filter(nonNullable);

export const useContractAllowance = (tokenMap: AddressMap, contractMap: AddressMap) => {
  const token = useDynamicTokenContract(tokenMap);
  const { address, networkId, connected } = useWeb3Context();

  return useQuery<BigNumber, Error>(
    contractAllowanceQueryKey(address, networkId, tokenMap, contractMap),
    async () => {
      queryAssertion(address && networkId, contractAllowanceQueryKey(address, networkId, tokenMap, contractMap));

      if (!token) throw new Error("Token doesn't exist on current network");

      const contractAddress = contractMap[networkId as NetworkId];
      if (!contractAddress) throw new Error("Contract doesn't exist on current network");

      return token.allowance(address, contractAddress);
    },
    { enabled: !!address && !!connected },
  );
};
