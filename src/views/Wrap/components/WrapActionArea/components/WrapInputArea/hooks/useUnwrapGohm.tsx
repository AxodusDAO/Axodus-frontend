import { t } from "@lingui/macro";
import { ContractReceipt } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { useMutation, useQueryClient } from "react-query";
import { useDispatch } from "react-redux";
import { GOHM_ADDRESSES, SOHM_ADDRESSES, STAKING_ADDRESSES } from "src/constants/addresses";
import { useWeb3Context } from "src/hooks";
import { balanceQueryKey, useBalance } from "src/hooks/useBalance";
import { useDynamicStakingContract } from "src/hooks/useContract";
import { useTestableNetworks } from "src/hooks/useTestableNetworks";
import { error as createErrorToast, info as createInfoToast } from "src/slices/MessagesSlice";

export const useUnwrapGohm = () => {
  const dispatch = useDispatch();
  const client = useQueryClient();
  const networks = useTestableNetworks();
  const { address, networkId } = useWeb3Context();
  const balance = useBalance(GOHM_ADDRESSES)[networks.MAINNET].data;
  const contract = useDynamicStakingContract(STAKING_ADDRESSES, true);

  return useMutation<ContractReceipt, Error, string>(
    async amount => {
      if (!amount || isNaN(Number(amount))) throw new Error(t`Please enter a number`);

      const parsedAmount = parseUnits(amount, 18);

      if (!parsedAmount.gt(0)) throw new Error(t`Please enter a number greater than 0`);

      if (!balance) throw new Error(t`Please refresh your page and try again`);

      if (parsedAmount.gt(balance)) throw new Error(t`You cannot unwrap more than your gOHM balance`);

      if (!contract) throw new Error(t`Please switch to the Ethereum network to unwrap your gOHM`);

      if (!address) throw new Error(t`Please refresh your page and try again`);

      const transaction = await contract.unwrap(address, parsedAmount);
      return transaction.wait();
    },
    {
      onError: error => {
        dispatch(createErrorToast(error.message));
      },
      onSuccess: async () => {
        const keysToRefetch = [
          balanceQueryKey(address, SOHM_ADDRESSES, networkId),
          balanceQueryKey(address, GOHM_ADDRESSES, networkId),
        ];

        const promises = keysToRefetch.map(key => client.refetchQueries(key, { active: true }));

        await Promise.all(promises);

        dispatch(createInfoToast(t`Successfully unwrapped from gOHM to sOHM`));
      },
    },
  );
};