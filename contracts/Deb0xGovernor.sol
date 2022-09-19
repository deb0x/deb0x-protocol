// // SPDX-License-Identifier: MIT

// pragma solidity 0.8.16;

// import "./Deb0x.sol";

// /** 
//  * @title Deb0xGovernor
//  * @dev Implements voting process for Deb0x proposals along with vote delegation
//  */
// contract Deb0xGovernor{

//     //Instance of Deb0x contract
//     Deb0x public deb0x;

//     //List of eligible voters
//     mapping(address => Voter) public voters;

//     //List of fee proposals
//     Proposal[] public proposals;
   
//    /**
//     * @dev Struct that describes a voter
//     *
//     * @param weight is accumulated by delegation
//     * @param voted if true, that person already voted
//     * @param delegate person delegated to
//     * @param vote index of the voted proposal
//     */
//     struct Voter {
//         uint weight;
//         bool voted;
//         address delegate;
//         uint256 vote;
//     }

//     /**
//      * @dev Struct that describes a proposal
//      * 
//      * @param motivation the description needed to argument why people to vote this proposal
//      * @param value of the Deb0x fee proposed to be implemented
//      * @param voteCount number of votes for this proposal
//      */
//     struct Proposal {
//         string motivation;  
//         uint16 value;
//         uint256 voteCount; // number of accumulated votes
//     }

//     constructor() {
//         deb0x = new Deb0x();
//     }

//     /**
//      * @notice Change the fee on Deb0x
//      */
//     function voteFee() public {
//         require(this.winnerName().value > 0 , "Deb0xGovernor: Param must be the winner value" );
//         deb0x.setFee(this.winnerName().value);
//     }

//     // not sure if rewardRate should be modified
//     // function voteRewardRate(uint256 newRewardRate) public {
//     //     require(this.winnerName().value == newRewardRate, "Deb0xGovernor: Param must be the winner value" );
//     //     deb0x.setRewardRate(newRewardRate);
//     // }

//     /** 
//      * @dev Give 'voter' the right to vote on this ballot. May only be called by 'chairperson'.
//      */
//     modifier redeemRightToVot() {
//         address voter = msg.sender;
//         require(deb0x.balanceERC20(voter) > 0, "Deb0xGovernor: must have staked deb0xERC20 on Deb0x to vote");
//         require(
//             !voters[voter].voted,
//             "Deb0xGovernor: The voter already voted."
//         );
//         require(voters[voter].weight == 0);
//         voters[voter].weight = 1;
//         _;
//     }

//     /**
//      * @notice Starts a proposal for fee
//      */
//     function setProposal(Proposal memory VoteProposal) redeemRightToVot public {
//             proposals.push( Proposal({
//                 motivation: VoteProposal.motivation,
//                 value: VoteProposal.value,
//                 voteCount: 0
//             }));
//     }

//     /**
//      * @dev Delegate your vote to the voter 'to'.
//      * @param to address to which vote is delegated
//      */
//     function delegate(address to) public {
//         Voter storage sender = voters[msg.sender];
//         require(!sender.voted, "Deb0xGovernor: Already voted.");
//         require(to != msg.sender, "Deb0xGovernor: Self-delegation is disallowed.");

//         while (voters[to].delegate != address(0)) {
//             to = voters[to].delegate;

//             // We found a loop in the delegation, not allowed.
//             require(to != msg.sender, "Deb0xGovernor: Found loop in delegation.");
//         }
//         sender.voted = true;
//         sender.delegate = to;
//         Voter storage delegate_ = voters[to];
//         if (delegate_.voted) {
//             // If the delegate already voted,
//             // directly add to the number of votes
//             proposals[delegate_.vote].voteCount += sender.weight;
//         } else {
//             // If the delegate did not vote yet,
//             // add to her weight.
//             delegate_.weight += sender.weight;
//         }
//     }

//     /**
//      * @dev Give your vote (including votes delegated to you) to proposal 'proposals[proposal].name'.
//      * @param proposal index of proposal in the proposals array
//      */
//     function vote(uint256 proposal) public {
//         Voter storage sender = voters[msg.sender];
//         require(sender.weight != 0, "Deb0xGovernor: Has no right to vote");
//         require(!sender.voted, "Deb0xGovernor: Already voted.");
//         sender.voted = true;
//         sender.vote = proposal;

//         // If 'proposal' is out of the range of the array,
//         // this will throw automatically and revert all
//         // changes.
//         proposals[proposal].voteCount += sender.weight;
//     }

//     /** 
//      * @dev Computes the winning proposal taking all previous votes into account.
//      * @return winningProposal_ index of winning proposal in the proposals array
//      */
//     function winningProposal() public view
//             returns (uint256 winningProposal_)
//     {
//         uint256 winningVoteCount = 0;
//         for (uint256 p = 0; p < proposals.length; p++) {
//             if (proposals[p].voteCount > winningVoteCount) {
//                 winningVoteCount = proposals[p].voteCount;
//                 winningProposal_ = p;
//             }
//         }
//     }

//     /** 
//      * @dev Calls winningProposal() function to get the index of the winner contained in the proposals array and then
//      * @return proposal that wins
//      */
//     function winnerName() public view
//             returns (Proposal memory)
//     {
//         return proposals[winningProposal()];
//     }
// }
