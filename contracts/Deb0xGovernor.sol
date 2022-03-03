// SPDX-License-Identifier: MIT

pragma solidity 0.8.12;

/** 
 * @title Deb0xGovernor
 * @dev Implements voting process for Deb0x proposals along with vote delegation
 */
import "./Deb0x.sol";

contract Deb0xGovernor{

    Deb0x public deb0x;

    mapping(address => Voter) public voters;

    Proposal[] public proposals;
   
    struct Voter {
        uint weight; // weight is accumulated by delegation
        bool voted;  // if true, that person already voted
        address delegate; // person delegated to
        uint vote;   // index of the voted proposal
    }

    struct Proposal {
        string name;  
        uint256 value;
        uint voteCount; // number of accumulated votes
    }

    constructor() {
        deb0x = new Deb0x();
    }

    function voteFee(uint16 newFee) public {
        require(this.winnerName().value == newFee, "Deb0xGovernor: Param must be the winner value" );
        deb0x.setFee(newFee);
    }

    function voteRewardRate(uint256 newRewardRate) public {
        require(this.winnerName().value == newRewardRate, "Deb0xGovernor: Param must be the winner value" );
        deb0x.setRewardRate(newRewardRate);
    }

       /** 
     * @dev Give 'voter' the right to vote on this ballot. May only be called by 'chairperson'.
     */
    modifier redeemRightToVot() {
        address voter = msg.sender;
        require(deb0x.balanceERC20(voter) > 0, "Deb0xGovernor: must have staked deb0xERC20 on Deb0x to vote");
        require(
            !voters[voter].voted,
            "Deb0xGovernor: The voter already voted."
        );
        require(voters[voter].weight == 0);
        voters[voter].weight = 1;
        _;
    }

    function setProposal(Proposal[] memory VoteProposal) redeemRightToVot public {
       for (uint i = 0; i < VoteProposal.length; i++) {
            proposals.push( Proposal({
                name: VoteProposal[i].name,
                value: VoteProposal[i].value,
                voteCount: 0
            }));
        }  
    }

    /**
     * @dev Delegate your vote to the voter 'to'.
     * @param to address to which vote is delegated
     */
    function delegate(address to) public {
        Voter storage sender = voters[msg.sender];
        require(!sender.voted, "Deb0xGovernor: Already voted.");
        require(to != msg.sender, "Deb0xGovernor: Self-delegation is disallowed.");

        while (voters[to].delegate != address(0)) {
            to = voters[to].delegate;

            // We found a loop in the delegation, not allowed.
            require(to != msg.sender, "Deb0xGovernor: Found loop in delegation.");
        }
        sender.voted = true;
        sender.delegate = to;
        Voter storage delegate_ = voters[to];
        if (delegate_.voted) {
            // If the delegate already voted,
            // directly add to the number of votes
            proposals[delegate_.vote].voteCount += sender.weight;
        } else {
            // If the delegate did not vote yet,
            // add to her weight.
            delegate_.weight += sender.weight;
        }
    }

    /**
     * @dev Give your vote (including votes delegated to you) to proposal 'proposals[proposal].name'.
     * @param proposal index of proposal in the proposals array
     */
    function vote(uint proposal) public {
        Voter storage sender = voters[msg.sender];
        require(sender.weight != 0, "Deb0xGovernor: Has no right to vote");
        require(!sender.voted, "Deb0xGovernor: Already voted.");
        sender.voted = true;
        sender.vote = proposal;

        // If 'proposal' is out of the range of the array,
        // this will throw automatically and revert all
        // changes.
        proposals[proposal].voteCount += sender.weight;
    }

    /** 
     * @dev Computes the winning proposal taking all previous votes into account.
     * @return winningProposal_ index of winning proposal in the proposals array
     */
    function winningProposal() public view
            returns (uint winningProposal_)
    {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    /** 
     * @dev Calls winningProposal() function to get the index of the winner contained in the proposals array and then
     * @return winnerName_ the name of the winner
     */
    function winnerName() public view
            returns (Proposal memory)
    {
        return proposals[winningProposal()];
    }
}
