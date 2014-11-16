/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package Test;

import java.text.DecimalFormat;
import java.text.NumberFormat;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author Ritsu Tainaka
 */
public class JUnitTest {
    
    Double bul(double f) {
        NumberFormat c = new DecimalFormat("#.#");
        return Double.valueOf(c.format(f));
    }
    
    @Test
    public void tambah() {
        double a = 5;
        double b = 2;
        double result = a + b;
        String tes;
        tes = String.valueOf(result);
        assertEquals("7.0", tes);
    }
    
    @Test
    public void kurang() {
        double a = 2;
        double b = 3;
        double result = bul(a - b);
        String tes;
        tes = String.valueOf(result);
        assertEquals("-1.0", tes);
    }
    
    @Test
    public void kali() {
        double a = 1;
        double b = 1;
        double result = bul(Math.exp(Math.log(a) + Math.log(b)));
        String tes;
        tes = String.valueOf(result);
        assertEquals("1.0", tes);
    }
    
    @Test
    public void bagi() {
        double a = 5;
        double b = 2;
        double result = bul(Math.exp(Math.log(a) - Math.log(b)));
        String tes;
        tes = String.valueOf(result);
        assertEquals("2.5", tes);
    }
    
    public JUnitTest() {
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