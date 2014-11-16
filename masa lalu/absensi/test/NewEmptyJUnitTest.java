/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

import GUI.absendulu;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author kagura
 */
public class NewEmptyJUnitTest {
    
    @Test
    public void array() {
        int i = 0;
        int k = 0;
        String b = "tes";
        String[] arraymhs = new String[40];
        arraymhs[i] = b;
        
        String[] testing = new String[40];
        testing[k] = "tes";
        
        assertArrayEquals(testing, arraymhs);
    }
    
    @Test
    public void result() {
        
    }
    
    public NewEmptyJUnitTest() {
    }
    
    @BeforeClass
    public static void setUpClass() {
    }
    
    @AfterClass
    public static void tearDownClass() {
    }
    
    @Before
    public void setUp() {
    }
    
    @After
    public void tearDown() {
    }
    // TODO add test methods here.
    // The methods must be annotated with annotation @Test. For example:
    //
    // @Test
    // public void hello() {}
}