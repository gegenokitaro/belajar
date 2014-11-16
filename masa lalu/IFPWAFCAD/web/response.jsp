<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@taglib prefix="sql" uri="http://java.sun.com/jsp/jstl/sql"%>
<%-- 
    Document   : response
    Created on : Oct 27, 2013, 11:00:33 PM
    Author     : kagura
--%>
<sql:query var="counselorQuery" dataSource="jdbc/IFPWAFCAD">
    SELECT * FROM Subject, Counselor 
    WHERE Counselor.counselor_id = Subject.counselor_idfk 
    AND Subject.subject_id = ? <sql:param value="${param.subject_id}"/>
</sql:query>

<c:set var="counselorDetails" value="${counselorQuery.rows[0]}"/>    

<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
        <link rel="stylesheet" type="text/css" href="style.css">
        <title>${counselorDetails.name}</title>
    </head>

    <body>
        <table>
            <tr>
                <th colspan="2">${counselorDetails.name}</th>
            </tr>
            <tr>
                <td><strong>Description: </strong></td>
                <td><span style="font-size:smaller; font-style:italic;">${counselorDetails.description}</span></td>
            </tr>
            <tr>
                <td><strong>Counselor: </strong></td>
                <td><strong>${counselorDetails.first_name} ${counselorDetails.nick_name} ${counselorDetails.last_name}</strong>
                    <br><span style="font-size:smaller; font-style:italic;">
                    <em>member since: ${counselorDetails.member_since}</em></span></td>
            </tr>
            <tr>
                <td><strong>Contact Details: </strong></td>
                <td><strong>email: </strong>
                    <a href="mailto:${counselorDetails.email}">${counselorDetails.email}</a>
                    <br><strong>phone: </strong>${counselorDetails.telephone}</td>
            </tr>
        </table>
    </body>
</html>
