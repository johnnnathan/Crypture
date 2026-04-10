mod node;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::node::{Circuit, OpType, Node, Port};
    use bit_vec::BitVec;

    // Helper to create a name string easily
    fn name(n: &str) -> String {
        n.to_string()
    }

    #[test]
    fn test_xor_operation() {
        // 1. Setup using the constructor
        let mut circuit = Circuit::new(name("Test Circuit"));

        // Add node (generates IDs 0, 1 for inputs and 2 for output)
        circuit.add_node(name("MyXOR"), OpType::Xor, 8);
        
        // 2. Prepare Input Data
        // We fetch IDs from the node to ensure we aren't guessing indices
        let (in0_id, in1_id, out_id) = {
            let node = &circuit.nodes[0];
            (node.inputs[0], node.inputs[1], node.outputs[0])
        };

        let data1 = BitVec::from_bytes(&[0b10100000]); 
        let data2 = BitVec::from_bytes(&[0b11000000]);

        circuit.get_port_mut(in0_id).unwrap().set_data(data1);
        circuit.get_port_mut(in1_id).unwrap().set_data(data2);

        // 3. Execute
        circuit.run_node(0);

        // 4. Assert
        let expected = BitVec::from_bytes(&[0b01100000]);
        let actual = circuit.get_port_data(out_id).unwrap();
        
        assert_eq!(actual, expected);
    }

    #[test]
    fn test_circuit_serialization_cycle() {
        let mut circuit = Circuit::new(name("SerialTest"));
        circuit.add_node(name("XOR_1"), OpType::Xor, 8);

        let json_data = circuit.to_json();
        let deserialized_circuit = Circuit::from_json(&json_data);

        assert_eq!(circuit.name, deserialized_circuit.name);
        assert_eq!(circuit.nodes.len(), deserialized_circuit.nodes.len());
        assert_eq!(circuit.ports.len(), deserialized_circuit.ports.len());
    }

    #[test]
    fn test_propagate_between_nodes() {
        let mut circuit = Circuit::new(name("Propagation Test"));

        circuit.add_node(name("XOR_0"), OpType::Xor, 8); // IDs 0, 1 -> 2
        circuit.add_node(name("XOR_1"), OpType::Xor, 8); // IDs 3, 4 -> 5

        // Connect Output of Node 0 (Port 2) to Input of Node 1 (Port 3)
        circuit.add_connection(2, 3);

        let val_a = BitVec::from_bytes(&[0b11000000]);
        let val_b = BitVec::from_bytes(&[0b10100000]);
        circuit.get_port_mut(0).unwrap().set_data(val_a);
        circuit.get_port_mut(1).unwrap().set_data(val_b);

        // Static input for XOR_1
        let val_c = BitVec::from_bytes(&[0b01110000]);
        circuit.get_port_mut(4).unwrap().set_data(val_c);

        // Execute Cycle
        circuit.run_node(0);             
        circuit.propagate_connections(); 
        circuit.run_node(1);             

        let final_output = circuit.get_port_data(5).unwrap();
        let expected = BitVec::from_bytes(&[0b00010000]);
        assert_eq!(final_output, expected);
    }

    #[test]
    fn test_node_removal_cleanup() {
        let mut circuit = Circuit::new(name("Cleanup Test"));

        circuit.add_node(name("N1"), OpType::Xor, 8); // Ports 0, 1, 2
        let out_port = circuit.nodes[0].outputs[0];
        
        circuit.add_node(name("N2"), OpType::Xor, 8); // Ports 3, 4, 5
        let in_port = circuit.nodes[1].inputs[0];

        circuit.add_connection(out_port, in_port);

        // Remove node by its ID
        let node_id_to_remove = circuit.nodes[0].id;
        circuit.remove_node(node_id_to_remove);

        assert_eq!(circuit.nodes.len(), 1);
        assert_eq!(circuit.connections.len(), 0);
        assert_eq!(circuit.ports.len(), 3); // Only N2's ports remain
    }
    #[test]
    fn test_circular_feedback_loop() {
        let mut circuit = Circuit::new(name("Feedback Loop"));
        
        // Create two XOR gates
        circuit.add_node(name("A"), OpType::Xor, 8); // IDs 0, 1 -> 2
        circuit.add_node(name("B"), OpType::Xor, 8); // IDs 3, 4 -> 5

        // Wire them in a circle: A_out -> B_in, B_out -> A_in
        circuit.add_connection(2, 3);
        circuit.add_connection(5, 1);

        // Initial seed data
        circuit.get_port_mut(0).unwrap().set_data(BitVec::from_bytes(&[0xAA]));
        circuit.get_port_mut(4).unwrap().set_data(BitVec::from_bytes(&[0x55]));

        // Run multiple cycles to see if data stabilizes or oscillates
        for _ in 0..5 {
            circuit.run_node(0);
            circuit.run_node(1);
            circuit.propagate_connections();
        }

        // Just check that we still have data and haven't crashed
        assert!(circuit.get_port_data(2).is_some());
        assert!(circuit.get_port_data(5).is_some());
    }
    
    #[test]
    fn test_massive_fan_out() {
        let mut circuit = Circuit::new(name("Fan Out"));
        
        // 1. Add Source Node
        circuit.add_node(name("Source"), OpType::Xor, 16); // Increased to 16 to match 0xDEAD
        let source_out_id = circuit.nodes[0].outputs[0]; // Get actual ID
        
        let mut target_input_ids = Vec::new();

        // 2. Create 10 target nodes and collect their REAL input IDs
        for i in 0..10 {
            circuit.add_node(format!("Target_{}", i), OpType::Xor, 16);
            // The new node is always the last one in the vector
            let last_idx = circuit.nodes.len() - 1;
            let in_id = circuit.nodes[last_idx].inputs[0];
            
            target_input_ids.push(in_id);
            circuit.add_connection(source_out_id, in_id);
        }

        // 3. Set source output
        // 0xDEAD is 16 bits. BitVec::from_bytes needs 2 bytes.
        let secret_data = BitVec::from_bytes(&[0xDE, 0xAD]);
        circuit.get_port_mut(source_out_id).unwrap().set_data(secret_data.clone());

        // 4. Propagate
        circuit.propagate_connections();

        // 5. Verify using the collected IDs
        for id in target_input_ids {
            let actual_data = circuit.get_port_data(id).expect("Target port should exist");
            assert_eq!(actual_data, secret_data, "Port {} did not receive the correct data", id);
        }
    }
    #[test]
    fn test_demand_driven_auto_compute() {
        let mut circuit = Circuit::new(name("AutoCompute"));

        // Setup: Node 0 (XOR) -> Node 1 (XOR)
        circuit.add_node(name("Stage1"), OpType::Xor, 8); // Ports 0, 1 -> 2
        circuit.add_node(name("Stage2"), OpType::Xor, 8); // Ports 3, 4 -> 5
        circuit.add_connection(2, 3);

        // Provide initial inputs
        // Stage 1: 0x01 ^ 0x02 = 0x03
        circuit.get_port_mut(0).unwrap().set_data(BitVec::from_bytes(&[0x01]));
        circuit.get_port_mut(1).unwrap().set_data(BitVec::from_bytes(&[0x02]));
        // Stage 2: (0x03) ^ 0x04 = 0x07
        circuit.get_port_mut(4).unwrap().set_data(BitVec::from_bytes(&[0x04]));

        // We NEVER call run_node or propagate_connections manually.
        // We just "pull" the final result.
        let final_result = circuit.pull_data(5);

        assert_eq!(final_result, BitVec::from_bytes(&[0x07]));
        
        // Verify that the intermediate port (2) was also updated in the process
        let intermediate = circuit.get_port_data(2).unwrap();
        assert_eq!(intermediate, BitVec::from_bytes(&[0x03]));
    }

    #[test]
    fn test_diamond_dependency() {
        let mut circuit = Circuit::new(name("Diamond"));

        // Node A (Source): ID 0, 1 -> 2
        circuit.add_node(name("A"), OpType::Xor, 8);
        // Node B (Sink): ID 3, 4 -> 5
        circuit.add_node(name("B"), OpType::Xor, 8);

        // Connect Output 2 to BOTH inputs of Node B
        circuit.add_connection(2, 3);
        circuit.add_connection(2, 4);

        // Set Node A inputs: 0x55 ^ 0xAA = 0xFF
        circuit.get_port_mut(0).unwrap().set_data(BitVec::from_bytes(&[0x55]));
        circuit.get_port_mut(1).unwrap().set_data(BitVec::from_bytes(&[0xAA]));

        // Pulling from B should result in 0xFF ^ 0xFF = 0x00
        let result = circuit.pull_data(5);
        assert_eq!(result, BitVec::from_bytes(&[0x00]));
    }
    #[test]
    fn test_pull_recursion_safety() {
        let mut circuit = Circuit::new(name("LoopSafe"));

        // Create a node and connect its output back to its input
        circuit.add_node(name("SelfLooper"), OpType::Xor, 8); // 0, 1 -> 2
        circuit.add_connection(2, 0);

        // Set the other input so the XOR has something to do
        circuit.get_port_mut(1).unwrap().set_data(BitVec::from_bytes(&[0x01]));

        // This would normally cause a Stack Overflow. 
        // With the 'visited' set, it should return the default/current value.
        let result = circuit.pull_data(2);
        
        // The test passing without a panic is the real "assertion" here.
        assert!(result.len() == 8);
    }
    #[test]
    fn test_iterate_with_pull_logic() {
        let mut circuit = Circuit::new(name("IterateTest"));

        // Chain: N0 -> N1 -> N2
        circuit.add_node(name("N0"), OpType::Xor, 8); // 0,1 -> 2
        circuit.add_node(name("N1"), OpType::Xor, 8); // 3,4 -> 5
        circuit.add_node(name("N2"), OpType::Xor, 8); // 6,7 -> 8

        circuit.add_connection(2, 3);
        circuit.add_connection(5, 6);

        // Set some inputs
        circuit.get_port_mut(0).unwrap().set_data(BitVec::from_bytes(&[0x10]));
        circuit.get_port_mut(1).unwrap().set_data(BitVec::from_bytes(&[0x01]));
        // (Other inputs default to 0)

        // A single iterate should now ripple the value 0x11 all the way to port 8
        circuit.iterate();

        let result = circuit.get_port_data(8).unwrap();
        assert_eq!(result, BitVec::from_bytes(&[0x11]));
    }
    #[test]
    fn test_dynamic_caesar_op() {
        let mut circuit = Circuit::new(name("DynamicCaesar"));
        
        // Add a Caesar node (In0: Data, In1: Shift -> Out0)
        circuit.add_node(name("C1"), OpType::Caesar, 8);
        
        let in_data = 0;
        let in_shift = 1;
        let out_port = 2;

        // Set Data to 'A' (65) and Shift to 5
        circuit.get_port_mut(in_data).unwrap().set_data(BitVec::from_bytes(&[65]));
        circuit.get_port_mut(in_shift).unwrap().set_data(BitVec::from_bytes(&[5]));

        // Pulling the data triggers op_caesar
        let result = circuit.pull_data(out_port);
        
        // 65 + 5 = 70 ('F')
        assert_eq!(result.to_bytes()[0], 70);
    }

#[test]
fn test_vigenere_as_universal_shift() {
    let mut circuit = Circuit::new("Universal".into());
    circuit.add_node("V1".into(), OpType::Vigenere, 40);

    let (in_p, key_p, out_p) = {
        let n = &circuit.nodes[0];
        (n.inputs[0], n.inputs[1], n.outputs[0])
    };

    circuit.get_port_mut(in_p).unwrap().set_data(BitVec::from_bytes(b"HELLO"));
    // Key is now 8 bits, so we send exactly 1 byte
    circuit.get_port_mut(key_p).unwrap().set_data(BitVec::from_bytes(&[1])); 

    let result = circuit.pull_data(out_p);
    assert_eq!(String::from_utf8_lossy(&result.to_bytes()), "IFMMP");
}
#[test]
fn test_big_data_processing() {
    let mut circuit = Circuit::new("BigDataEngine".into());
    let bit_width: u16 = 10000; 
    
    circuit.add_node("Vigenere_1".into(), OpType::Vigenere, bit_width);

    let (in_p, key_p, out_p) = {
        let n = &circuit.nodes[0];
        (n.inputs[0], n.inputs[1], n.outputs[0])
    };

    // 1. Setup Input Data
    let mut in_port = Port::new(in_p, bit_width);
    in_port.fill_random();
    let original_data = in_port.get_data().clone();
    let original_bytes = original_data.to_bytes();
    
    // 2. Setup Key (1 byte = 5)
    let key_byte = 5u8;
    let key_bv = BitVec::from_bytes(&[key_byte]);

    circuit.get_port_mut(in_p).unwrap().set_data(original_data);
    circuit.get_port_mut(key_p).unwrap().set_data(key_bv);

    // 3. Run
    let result = circuit.pull_data(out_p);
    let result_bytes = result.to_bytes();

    // --- PRINTING SECTION ---
    println!("\n--- Data Preview (First 32 Bytes) ---");
    println!("Input:  {:?}", &original_bytes[..32]);
    println!("Key:    [{}]", key_byte);
    println!("Output: {:?}", &result_bytes[..32]);
    println!("-------------------------------------\n");

    // 4. Verify entire buffer
    for (i, &byte) in result_bytes.iter().enumerate() {
        assert_eq!(byte, original_bytes[i].wrapping_add(key_byte));
    }
    
    println!("Successfully verified {} bits!", bit_width);
}
#[test]
fn test_proper_vigenere_repetition() {
    let mut circuit = Circuit::new("RepetitionTest".into());
    
    // HELLO is 40 bits. The engine creates an 8-bit key port automatically.
    circuit.add_node("V1".into(), OpType::Vigenere, 40);

    let in_p = 0;
    let key_p = 1;
    let out_p = 2;

    // Set 5 bytes of data
    circuit.get_port_mut(in_p).unwrap().set_data(BitVec::from_bytes(b"HELLO"));
    
    // Set 1 byte of key. This now matches the port width (8) and is ACCEPTED.
    circuit.get_port_mut(key_p).unwrap().set_data(BitVec::from_bytes(&[1])); 

    let result = circuit.pull_data(out_p);
    
    // Every letter shifted by 1
    assert_eq!(String::from_utf8_lossy(&result.to_bytes()), "IFMMP");
}
}