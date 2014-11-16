/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package absencli;

import java.util.Arrays;
import java.util.Scanner;

/**
 *
 * @author kagura
 */
public class Absencli {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) {
        // TODO code application logic here
        while(true) {
            System.out.println("menu ");
            System.out.println("1. masukan data");
            System.out.println("2. tampilkan data");
            System.out.println("?: ");
            Scanner b = new Scanner(System.in);
            String a = b.nextLine();
            switch (a) {
                case "1":
                    pilihan.masuk();
                    break;
                case "2":
                    pilihan.tampil();
                    break;
                default:
                    System.out.println("ga ada pilihan itu");
            }
            System.out.println("");
        }
    }
}
