mod node;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::node::{Circuit, OpType, Node, Port};

    // Helper to create a name string easily
    fn name(n: &str) -> String {
        n.to_string()
    }

    #[test]
    fn test_xor_operation() {
        let mut circuit = Circuit::new(name("Test Circuit"));

        // Add node
        circuit.add_node(name("MyXOR"), OpType::Xor, 8);
        
        let (in0_id, in1_id, out_id) = {
            let node = &circuit.nodes[0];
            (node.inputs[0], node.inputs[1], node.outputs[0])
        };

        let data1 = vec![0b10100000]; 
        let data2 = vec![0b11000000];

        circuit.get_port_mut(in0_id).unwrap().set_data(data1);
        circuit.get_port_mut(in1_id).unwrap().set_data(data2);

        circuit.run_node(0);

        let expected = vec![0b01100000];
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

        circuit.add_node(name("XOR_0"), OpType::Xor, 8); 
        circuit.add_node(name("XOR_1"), OpType::Xor, 8); 

        circuit.add_connection(2, 3);

        let val_a = vec![0b11000000];
        let val_b = vec![0b10100000];
        circuit.get_port_mut(0).unwrap().set_data(val_a);
        circuit.get_port_mut(1).unwrap().set_data(val_b);

        let val_c = vec![0b01110000];
        circuit.get_port_mut(4).unwrap().set_data(val_c);

        circuit.run_node(0);             
        circuit.propagate_connections(); 
        circuit.run_node(1);             

        let final_output = circuit.get_port_data(5).unwrap();
        let expected = vec![0b00010000];
        assert_eq!(final_output, expected);
    }

    #[test]
    fn test_node_removal_cleanup() {
        let mut circuit = Circuit::new(name("Cleanup Test"));

        circuit.add_node(name("N1"), OpType::Xor, 8); 
        let out_port = circuit.nodes[0].outputs[0];
        
        circuit.add_node(name("N2"), OpType::Xor, 8); 
        let in_port = circuit.nodes[1].inputs[0];

        circuit.add_connection(out_port, in_port);

        let node_id_to_remove = circuit.nodes[0].id;
        circuit.remove_node(node_id_to_remove);

        assert_eq!(circuit.nodes.len(), 1);
        assert_eq!(circuit.connections.len(), 0);
        assert_eq!(circuit.ports.len(), 3); 
    }

    #[test]
    fn test_circular_feedback_loop() {
        let mut circuit = Circuit::new(name("Feedback Loop"));
        
        circuit.add_node(name("A"), OpType::Xor, 8); 
        circuit.add_node(name("B"), OpType::Xor, 8); 

        circuit.add_connection(2, 3);
        circuit.add_connection(5, 1);

        circuit.get_port_mut(0).unwrap().set_data(vec![0xAA]);
        circuit.get_port_mut(4).unwrap().set_data(vec![0x55]);

        for _ in 0..5 {
            circuit.run_node(0);
            circuit.run_node(1);
            circuit.propagate_connections();
        }

        assert!(circuit.get_port_data(2).is_some());
        assert!(circuit.get_port_data(5).is_some());
    }
    
    #[test]
    fn test_massive_fan_out() {
        let mut circuit = Circuit::new(name("Fan Out"));
        
        circuit.add_node(name("Source"), OpType::Xor, 16); 
        let source_out_id = circuit.nodes[0].outputs[0]; 
        
        let mut target_input_ids = Vec::new();

        for i in 0..10 {
            circuit.add_node(format!("Target_{}", i), OpType::Xor, 16);
            let last_idx = circuit.nodes.len() - 1;
            let in_id = circuit.nodes[last_idx].inputs[0];
            
            target_input_ids.push(in_id);
            circuit.add_connection(source_out_id, in_id);
        }

        let secret_data = vec![0xDE, 0xAD];
        circuit.get_port_mut(source_out_id).unwrap().set_data(secret_data.clone());

        circuit.propagate_connections();

        for id in target_input_ids {
            let actual_data = circuit.get_port_data(id).expect("Target port should exist");
            assert_eq!(actual_data, secret_data);
        }
    }

    #[test]
    fn test_demand_driven_auto_compute() {
        let mut circuit = Circuit::new(name("AutoCompute"));

        circuit.add_node(name("Stage1"), OpType::Xor, 8); 
        circuit.add_node(name("Stage2"), OpType::Xor, 8); 
        circuit.add_connection(2, 3);

        circuit.get_port_mut(0).unwrap().set_data(vec![0x01]);
        circuit.get_port_mut(1).unwrap().set_data(vec![0x02]);
        circuit.get_port_mut(4).unwrap().set_data(vec![0x04]);

        let final_result = circuit.pull_data(5);

        assert_eq!(final_result, vec![0x07]);
        
        let intermediate = circuit.get_port_data(2).unwrap();
        assert_eq!(intermediate, vec![0x03]);
    }

    #[test]
    fn test_diamond_dependency() {
        let mut circuit = Circuit::new(name("Diamond"));

        circuit.add_node(name("A"), OpType::Xor, 8);
        circuit.add_node(name("B"), OpType::Xor, 8);

        circuit.add_connection(2, 3);
        circuit.add_connection(2, 4);

        circuit.get_port_mut(0).unwrap().set_data(vec![0x55]);
        circuit.get_port_mut(1).unwrap().set_data(vec![0xAA]);

        let result = circuit.pull_data(5);
        assert_eq!(result, vec![0x00]);
    }

    #[test]
    fn test_pull_recursion_safety() {
        let mut circuit = Circuit::new(name("LoopSafe"));

        circuit.add_node(name("SelfLooper"), OpType::Xor, 8); 
        circuit.add_connection(2, 0);

        circuit.get_port_mut(1).unwrap().set_data(vec![0x01]);

        let result = circuit.pull_data(2);
        
        // Ensure result exists and has correct byte length (8 bits = 1 byte)
        assert!(result.len() == 1);
    }

    #[test]
    fn test_iterate_with_pull_logic() {
        let mut circuit = Circuit::new(name("IterateTest"));

        circuit.add_node(name("N0"), OpType::Xor, 8); 
        circuit.add_node(name("N1"), OpType::Xor, 8); 
        circuit.add_node(name("N2"), OpType::Xor, 8); 

        circuit.add_connection(2, 3);
        circuit.add_connection(5, 6);

        circuit.get_port_mut(0).unwrap().set_data(vec![0x10]);
        circuit.get_port_mut(1).unwrap().set_data(vec![0x01]);

        circuit.iterate();

        let result = circuit.get_port_data(8).unwrap();
        assert_eq!(result, vec![0x11]);
    }

    #[test]
    fn test_dynamic_caesar_op() {
        let mut circuit = Circuit::new(name("DynamicCaesar"));
        
        circuit.add_node(name("C1"), OpType::Caesar, 8);
        
        let in_data = 0;
        let in_shift = 1;
        let out_port = 2;

        circuit.get_port_mut(in_data).unwrap().set_data(vec![65]); // 'A'
        circuit.get_port_mut(in_shift).unwrap().set_data(vec![5]);

        let result = circuit.pull_data(out_port);
        
        assert_eq!(result[0], 70); // 'F'
    }

    #[test]
    fn test_vigenere_as_universal_shift() {
        let mut circuit = Circuit::new("Universal".into());
        // Spec: [base, base, 16] -> [base]
        circuit.add_node("V1".into(), OpType::Vigenere, 40);

        let (in_p, key_p, len_p) = (0, 1, 2); // IDs 0, 1, 2 are inputs; 3 is output

        // 1. Data (5 bytes)
        circuit.get_port_mut(in_p).unwrap().set_data(b"HELLO".to_vec());
        
        // 2. Key (Must be 5 bytes to match base_width 40)
        circuit.get_port_mut(key_p).unwrap().set_data(vec![1, 1, 1, 1, 1]); 
        
        // 3. Length (2 bytes for u16)
        circuit.get_port_mut(len_p).unwrap().set_data(vec![1, 0]); // Length = 1

        let result = circuit.pull_data(3); // Output ID is now 3
        assert_eq!(String::from_utf8_lossy(&result), "IFMMP");
    }

    #[test]
    fn test_big_data_processing() {
        let mut circuit = Circuit::new("BigDataEngine".into());
        let bit_width: u16 = 10000; 
        let byte_width = (bit_width / 8) as usize;
        
        circuit.add_node("Vigenere_1".into(), OpType::Vigenere, bit_width);

        let (in_p, key_p, len_p, out_p) = (0, 1, 2, 3);

        let mut in_port = Port::new(in_p, bit_width);
        in_port.fill_random();
        let original_bytes = in_port.get_data().clone();
        
        // Key must match bit_width (1250 bytes)
        let mut key_vec = vec![0u8; byte_width];
        key_vec[0] = 5; // Set first byte to 5
        
        // Set Length to 1 so it cycles that '5' across the whole 1250 bytes
        let len_vec = 1u16.to_le_bytes().to_vec();

        circuit.get_port_mut(in_p).unwrap().set_data(original_bytes.clone());
        circuit.get_port_mut(key_p).unwrap().set_data(key_vec);
        circuit.get_port_mut(len_p).unwrap().set_data(len_vec);

        let result_bytes = circuit.pull_data(out_p);

        for (i, &byte) in result_bytes.iter().enumerate() {
            assert_eq!(byte, original_bytes[i].wrapping_add(5));
        }
    }

    #[test]
    fn test_proper_vigenere_repetition() {
        let mut circuit = Circuit::new("RepetitionTest".into());
        circuit.add_node("V1".into(), OpType::Vigenere, 40);

        let (in_p, key_p, len_p, out_p) = (0, 1, 2, 3);

        circuit.get_port_mut(in_p).unwrap().set_data(b"HELLO".to_vec());
        
        // Key: [1, 2, 0, 0, 0] (5 bytes)
        // Length: 2
        // H+1, E+2, L+1, L+2, O+1
        circuit.get_port_mut(key_p).unwrap().set_data(vec![1, 2, 0, 0, 0]); 
        circuit.get_port_mut(len_p).unwrap().set_data(vec![2, 0]); 

        let result = circuit.pull_data(out_p);
        
        // H(72)+1=73(I), E(69)+2=71(G), L(76)+1=77(M), L(76)+2=78(N), O(79)+1=80(P)
        assert_eq!(String::from_utf8_lossy(&result), "IGMNP");
    }
}