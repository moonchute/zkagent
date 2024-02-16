// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
    uint256 constant alphay  = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
    uint256 constant betax1  = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
    uint256 constant betax2  = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
    uint256 constant betay1  = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
    uint256 constant betay2  = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant deltax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant deltay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant deltay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;

    
    uint256 constant IC0x = 8527971528674664187055141739896673685693908905358738857661035890717593940636;
    uint256 constant IC0y = 16392058577492254269342740600522800153083572483002733296563695386270397635966;
    
    uint256 constant IC1x = 1103547243618666843860762615740248631409158130154575424398326512401389715865;
    uint256 constant IC1y = 9151217564596533004915356994916366328257435553534636579118840142718235101638;
    
    uint256 constant IC2x = 7187126271590478351081313818172680815249131450133863219568568466063787102028;
    uint256 constant IC2y = 8370957901740788409645843304522881499595921873591554793170537404551422965822;
    
    uint256 constant IC3x = 4145611591109252089597318306135439432031878866344413840109897796617248115431;
    uint256 constant IC3y = 18579338944096953724745271458915991855479566584340631157966288367268543379350;
    
    uint256 constant IC4x = 20053264275756261660054054423637974125133488878638413297769685123226340615815;
    uint256 constant IC4y = 13256686046392339443360879555927644859452183453646721458471504075914760981200;
    
    uint256 constant IC5x = 13640361668521767245274599736982013006209545665848146905268907786785244868796;
    uint256 constant IC5y = 5984383048220781201676389307256130958204314986320636756185494930720833056293;
    
    uint256 constant IC6x = 20827512611663674601192363763249065071471575831209741583230452097175357107156;
    uint256 constant IC6y = 5681836345819471323760378237284834961555554863300224411013710020556552654067;
    
    uint256 constant IC7x = 11024458505863823333844095036692524650844045829831103661470806389605009730843;
    uint256 constant IC7y = 10072417339506839228728790506412740412538843039323423551264300404967726083644;
    
    uint256 constant IC8x = 9320135801523777081669776738385207036445639954691895715492988063005214708687;
    uint256 constant IC8y = 11324945146074848195667727728392362832029063071921233012123057217037939267465;
    
    uint256 constant IC9x = 2307441336630952292167928026596616949956925591884887001929944302704881466224;
    uint256 constant IC9y = 8844341388206994919334218174119340456782092179627275973209883411677603326519;
    
    uint256 constant IC10x = 2080983950027958819955712915186469975571668763803573056420040046601268819745;
    uint256 constant IC10y = 7684033046101957945301645568940617063099775998858080297351231443690584436525;
    
    uint256 constant IC11x = 7391847361520770757264396136870508553511887155556538808214517627531060003894;
    uint256 constant IC11y = 11885152645654453129619205731629435664137727552024589440041344456018786783877;
    
    uint256 constant IC12x = 688980751326303462334530312858053467479652491138505228672480315074574128954;
    uint256 constant IC12y = 9915779413019759741637659775909605488053685361049966318902698826207835422040;
    
    uint256 constant IC13x = 8026407893832147742084686206310561036537535181386452470726085525347417549542;
    uint256 constant IC13y = 7652717923151953122322680145257740794984734975059328977771395831800542591109;
    
    uint256 constant IC14x = 5378657269956435701709743387602111759580118359583613907929029767308775652266;
    uint256 constant IC14y = 20526519145918772521015906989780403322958427099339415594664185889316559167239;
    
    uint256 constant IC15x = 10883428903695580342485144735397514575112060368839866331550019612693725325251;
    uint256 constant IC15y = 5226702790640275383671844793754016512963265191647337938957802971573977040615;
    
    uint256 constant IC16x = 15758576222157317881330429997561903123151114989300008604766184914542495251844;
    uint256 constant IC16y = 17689949895219693768543040786224173630633557933840136523098594164858173059849;
    
    uint256 constant IC17x = 17425875602833516402621765101043581192355138059548610296067147258165004996575;
    uint256 constant IC17y = 18455751093457572793622811788130994487547890044380864893338136771965429573027;
    
    uint256 constant IC18x = 3506298381705921664674487721418704623373808346224088209007746565701246170333;
    uint256 constant IC18y = 17821668929521342217493349014654296444393184706754498019804303088375150619375;
    
    uint256 constant IC19x = 15426851104121816204343161616780600804341661775434390489194975078250921640573;
    uint256 constant IC19y = 5108055328926212530796717318503005778579832585700509315226163587549980441327;
    
    uint256 constant IC20x = 6802906556980399144137393428181563486753622906059609795824141995013059399400;
    uint256 constant IC20y = 323850483347721162622128133131322551710877146381396536458679298679595750770;
    
    uint256 constant IC21x = 16572902683586495732305898677542014580974373304669348184948847688821780974388;
    uint256 constant IC21y = 16204010449073578333652604960395759356285853317600672530867209094244422752621;
    
    uint256 constant IC22x = 1958757471671356783780801791066466416532991627749190357467994304077217669892;
    uint256 constant IC22y = 10328901884589401758627928327297444469513551493214915350468411482365997855746;
    
    uint256 constant IC23x = 12089164916992203277272397024230027898799810881206075700392584826650080610012;
    uint256 constant IC23y = 5757456094212563221494501751422764087559856692602483917627885146178079937098;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[23] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, q)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                
                g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            
            checkField(calldataload(add(_pubSignals, 704)))
            
            checkField(calldataload(add(_pubSignals, 736)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
